import { selectUsers } from './user';
import { calculateFillEventTotalPrice, getUnpaidFillEvents } from './payment';
import { type MinifiedUserResponse } from '../../types/user.types';
import { type InvoiceRow, type Invoice } from '../../types/invoices.types';

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
