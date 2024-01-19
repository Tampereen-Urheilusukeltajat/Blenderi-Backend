import { knexController } from '../../database/database';
import { PaymentStatus } from '../../types/payment.types';
import { DBResponse } from '../../types/general.types';

/**
 * Get unpaid fill events for user. Fill event is unpaid if it is not linked to
 * any payment events or if the payment event has failed
 * @param userId
 * @returns
 */
export const getUnpaidFillEventsForUser = async (
  userId: string
): Promise<number[]> => {
  const [fillEventIds] = await knexController.raw<
    DBResponse<Array<{ fill_event_id: number }>>
  >(
    `
    SELECT DISTINCT
      fe.id AS fill_event_id
    FROM fill_event fe
    JOIN fill_event_gas_fill fegf ON fegf.fill_event_id = fe.id
    LEFT JOIN fill_event_payment_event fepe ON fepe.fill_event_id = fe.id
    LEFT JOIN payment_event pe ON pe.id = fepe.payment_event_id
    WHERE
      -- Filter out air fills since they don't have storage cylinders
      fegf.storage_cylinder_id IS NOT NULL AND 
        fe.user_id = ? AND (
          fepe.fill_event_id IS NULL OR
          pe.status = ?
        )
  `,
    [userId, PaymentStatus.failed]
  );

  if (!fillEventIds || fillEventIds.length === 0) return [];

  return fillEventIds.map((v) => v.fill_event_id);
};

/**
 * Calculates the total amount due for all the fill events
 * @param fillEventIds
 */
export const calculateFillEventTotalPrice = async (
  fillEventIds: string[]
): Promise<number> => {
  const [totalPrice] = await knexController.raw<DBResponse<number[]>>(
    `
    SELECT
      SUM(fegf.volume_litres * gp.price_eur_cents) AS total_price
    FROM fill_event fe
    JOIN fill_event_gas_fill fegf ON fegf.fill_event_id = fe.id
    JOIN gas_price gp ON gp.id = fegf.gas_price_id
    WHERE
      fe.id IN (${fillEventIds.map(() => '?').join(',')}) AND
      fegf.storage_cylinder_id IS NOT NULL
  `,
    [...fillEventIds]
  );

  return totalPrice.length !== 0 ? totalPrice[0] : 0;
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
  fillEventIds: number[]
): Promise<string> => {
  const trx = await knexController.transaction();

  const res = await trx.raw<Array<Array<{ id: string }>>>(
    `
    INSERT INTO payment_event (user_id) VALUES (?) RETURNING id
  `,
    [userId]
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
    ]
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
  newStatus: PaymentStatus
): Promise<void> => {
  await knexController.raw(
    `
    UPDATE payment_event
    SET status = ?
    WHERE id = ?
  `,
    [newStatus, paymentEventId]
  );
};

/**
 * Get fill events for linked payment event for example showing them to user
 * @param paymentEventId
 * @returns
 */
export const getFillEventsForPaymentEvent = async (
  paymentEventId: string
): Promise<number[]> => {
  // TODO query fill event instead of just the id
  const [fillEventIds] = await knexController.raw<DBResponse<number[]>>(
    `
    SELECT
      fepe.fill_event_id
    FROM fill_event_payment_event fepe
    WHERE 
      fepe.payment_event_id = ?
  `,
    [paymentEventId]
  );

  return fillEventIds;
};
