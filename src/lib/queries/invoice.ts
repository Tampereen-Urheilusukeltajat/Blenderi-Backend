import { selectUsers } from './user';
import {
  calculateFillEventTotalPrice,
  createPaymentEvent,
  getUnpaidFillEvents,
} from './payment';
import { type MinifiedUserResponse } from '../../types/user.types';
import { type InvoiceRow, type Invoice } from '../../types/invoices.types';
import { knexController } from '../../database/database';
import { PaymentStatus } from '../../types/payment.types';
import { type Knex } from 'knex';

/**
 * Get all unpaid fill events per user and their total price
 * @returns
 */
export const getAllInvoices = async (): Promise<Invoice[]> => {
  const users = await selectUsers();

  // Horrifyingly unoptimized code
  const usersWithUnpaidFillEvents = await Promise.all<
    MinifiedUserResponse & { unpaidFillEvents: InvoiceRow[] }
  >(
    users.map(async (user) => ({
      email: user.email,
      id: user.id,
      forename: user.forename,
      surname: user.surname,
      unpaidFillEvents: await getUnpaidFillEvents(user.id),
    })),
  );

  const filteredUsers = usersWithUnpaidFillEvents.filter(
    (user) => user.unpaidFillEvents.length > 0,
  );

  const usersWithFillEventsAndTotals = await Promise.all(
    filteredUsers.map(async (user) => ({
      ...user,
      invoiceTotal: await calculateFillEventTotalPrice(
        user.unpaidFillEvents.map((e) => e.id),
      ),
    })),
  );

  return usersWithFillEventsAndTotals.map((user) => ({
    user: {
      id: user.id,
      email: user.email,
      forename: user.forename,
      surname: user.surname,
    },
    invoiceTotal: user.invoiceTotal,
    invoiceRows: user.unpaidFillEvents,
  }));
};

const createInvoiceTableRows = async (
  paymentEventIds: string[],
  createdByUserId: string,
  trx: Knex.Transaction,
): Promise<void> => {
  await trx.raw(
    `
    INSERT INTO invoice (payment_event_id, created_by)
    VALUES ${paymentEventIds.map(() => '(?, ?)').join(',')}
  `,
    paymentEventIds.flatMap((paymentEventId) => [
      paymentEventId,
      createdByUserId,
    ]),
  );
};

/**
 * Create payment events for invoices. Invoices are automatically set to
 * completed status because we don't have control over the actual payment
 * process. These invoices are handled by the treasurer.
 * @param invoices
 */
export const createInvoicePaymentEvents = async (
  invoices: Invoice[],
  createdByUserId: string,
): Promise<void> => {
  const trx = await knexController.transaction();

  const paymentEventIds = await Promise.all(
    invoices.map(async (invoice) =>
      createPaymentEvent(
        invoice.user.id,
        invoice.invoiceRows.map((ir) => ir.id),
        invoice.invoiceTotal,
        trx,
        PaymentStatus.completed,
      ),
    ),
  );

  await createInvoiceTableRows(paymentEventIds, createdByUserId, trx);

  await trx.commit();
};
