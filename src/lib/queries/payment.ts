import { knexController } from '../../database/database';
import { type DBResponse } from '../../types/general.types';
import { type InvoiceRow } from '../../types/invoices.types';
import { PaymentStatus } from '../../types/payment.types';

/**
 * Get unpaid fill events for user. Fill event is unpaid if
 * it is not linked to
 * any payment events or if the payment event has failed
 * @param userId
 * @returns
 */
export const getUnpaidFillEvents = async (
  userId: string,
): Promise<InvoiceRow[]> => {
  const [fillEvents] = await knexController.raw<
    DBResponse<
      Array<{
        fill_event_id: number;
        fill_event_date: string;
        fill_event_description: string;
        fill_event_gas_mixture: string;
      }>
    >
  >(
    `
    SELECT DISTINCT
      fe.id AS fill_event_id,
      fe.created_at AS fill_event_date,
      fe.description AS fill_event_description,
      fe.gas_mixture AS fill_event_gas_mixture,
    FROM fill_event fe
    JOIN fill_event_gas_fill fegf ON fegf.fill_event_id = fe.id
    LEFT JOIN fill_event_payment_event fepe ON fepe.fill_event_id = fe.id
    LEFT JOIN payment_event pe ON pe.id = fepe.payment_event_id
    WHERE
      -- Filter out air fills since they don't have storage cylinders
      -- (and air is free)
      fegf.storage_cylinder_id IS NOT NULL AND 
      fe.user_id = ? AND 
      (
        -- Filter out fill events which have been paid already. Aka if
        -- fill event already has completed payment event linked to it,
        -- ignore the row
        NOT EXISTS (
          SELECT
            fepe2.fill_event_id
          FROM fill_event_payment_event fepe2
          JOIN payment_event pe2 ON 
            pe2.id = fepe2.payment_event_id AND
            pe2.status = "COMPLETED"
          WHERE
            fepe2.fill_event_id = fe.id
        ) 
        -- If there are no payment events linked or the status is FAILED,
        -- fill event is considered unpaid and we should return the row
        AND (
          fepe.fill_event_id IS NULL OR
          pe.status = "FAILED"
        )
      )
  `,
    [userId],
  );

  if (!fillEvents || fillEvents.length === 0) return [];

  return fillEvents.map((v) => ({
    id: v.fill_event_id,
    date: v.fill_event_date,
    description: v.fill_event_description,
    gasMixture: v.fill_event_gas_mixture,
  }));
};

/**
 * Calculates the total amount due for all the fill events
 * @param fillEventIds
 */
export const calculateFillEventTotalPrice = async (
  fillEventIds: number[],
): Promise<number> => {
  const [totalPrice] = await knexController.raw<
    DBResponse<Array<{ totalPrice: number }>>
  >(
    `
    SELECT
      SUM(fegf.volume_litres * gp.price_eur_cents) AS totalPrice
    FROM fill_event fe
    JOIN fill_event_gas_fill fegf ON fegf.fill_event_id = fe.id
    JOIN gas_price gp ON gp.id = fegf.gas_price_id
    WHERE
      fe.id IN (${fillEventIds.map(() => '?').join(',')}) AND
      fegf.storage_cylinder_id IS NOT NULL
  `,
    [...fillEventIds],
  );

  if (totalPrice?.[0]?.totalPrice === null) {
    return 0;
  }

  return totalPrice[0].totalPrice;
};

/**
 * Start payment process by creating a payment event and linking the relevant
 * fill events to the event
 * @param userId
 * @param fillEventIds
 * @returns
 */
export const createPaymentEvent = async (
  userId: string,
  fillEventIds: number[],
  totalCost: number,
  status: PaymentStatus = PaymentStatus.created,
): Promise<string> => {
  const trx = await knexController.transaction();

  const res = await trx.raw<Array<Array<{ id: string }>>>(
    `
    INSERT INTO payment_event (user_id, total_amount_eur_cents, status) VALUES (?,?,?) RETURNING id
  `,
    [userId, totalCost, status],
  );

  const [[{ id: insertedPaymentEventId }]] = res;

  await trx.raw(
    `
    INSERT INTO fill_event_payment_event (payment_event_id, fill_event_id)
    VALUES ${fillEventIds.map(() => '(?, ?)').join(',')}
  `,
    [
      ...fillEventIds.flatMap((fillEventId) => [
        insertedPaymentEventId,
        fillEventId,
      ]),
    ],
  );

  await trx.commit();

  return insertedPaymentEventId;
};

/**
 * Update the payment status
 * @param paymentEventId
 * @param newStatus
 */
export const updatePaymentEventStatus = async (
  paymentEventId: string,
  newStatus: PaymentStatus,
): Promise<void> => {
  await knexController.raw(
    `
    UPDATE payment_event
    SET status = ?
    WHERE id = ?
  `,
    [newStatus, paymentEventId],
  );
};
