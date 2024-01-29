import { knexController } from '../../database/database';
import {
  ExtendedPaymentEvent,
  PaymentEvent,
  PaymentStatus,
} from '../../types/payment.types';
import { DBResponse } from '../../types/general.types';
import { getPaymentIntent } from '../payment/stripeApi';

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
  fillEventIds: number[]
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
    [...fillEventIds]
  );

  if (!totalPrice || !totalPrice[0] || totalPrice[0].totalPrice === null) {
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
  const [fillEventIds] = await knexController.raw<
    DBResponse<Array<{ fillEventId: number }>>
  >(
    `
    SELECT
      fepe.fill_event_id as fillEventId
    FROM fill_event_payment_event fepe
    WHERE 
      fepe.payment_event_id = ?
  `,
    [paymentEventId]
  );

  return fillEventIds.map((fe) => fe.fillEventId);
};

/**
 * Get payment events for user
 * @param userId
 * @returns
 */
export const getPaymentEvents = async (
  userId: string
): Promise<PaymentEvent[]> => {
  const [paymentEvents] = await knexController.raw<DBResponse<PaymentEvent[]>>(
    `
    SELECT
      id,
      user_id AS userId,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM payment_event
    WHERE user_id = ?
  `,
    [userId]
  );

  return paymentEvents;
};

type ExtendedPaymentEventDbResponse = Omit<
  ExtendedPaymentEvent,
  'stripePaymentClientSecret'
> & {
  stripePaymentIntentId?: string;
};

/**
 * Get payment event with id and user id. User id is also included to make sure
 * user can only query their own events.
 * @param paymentEventId
 * @param userId
 * @returns
 */
export const getPaymentEvent = async (
  paymentEventId: string,
  userId: string
): Promise<ExtendedPaymentEvent | undefined> => {
  const [paymentEvents] = await knexController.raw<
    DBResponse<ExtendedPaymentEventDbResponse[]>
  >(
    `
    SELECT
      pe.id,
      pe.user_id AS userId,
      pe.status,
      pe.created_at AS createdAt,
      pe.updated_at AS updatedAt,
      spi.payment_intent_id AS stripePaymentIntentId,
      spi.payment_method AS stripePaymentMethod,
      spi.amount_eur_cents AS stripeAmountEurCents,
      spi.status AS stripePaymentStatus
    FROM payment_event pe
    LEFT JOIN stripe_payment_intent spi ON spi.payment_event_id = pe.id
    WHERE pe.id = ? AND pe.user_id = ?
  `,
    [paymentEventId, userId]
  );
  const paymentEvent = paymentEvents[0];

  if (!paymentEvent) {
    return undefined;
  }

  // Query payment event from Stripe to get the client_secret
  if (paymentEvent.stripePaymentIntentId) {
    const stripePaymentIntent = await getPaymentIntent(
      paymentEvent.stripePaymentIntentId
    );
    if (stripePaymentIntent?.client_secret) {
      return {
        ...paymentEvent,
        stripePaymentClientSecret: stripePaymentIntent.client_secret,
        stripePaymentStatus: stripePaymentIntent.status,
      };
    }
  }

  return {
    ...paymentEvent,
    stripePaymentClientSecret: undefined,
    stripeAmountEurCents: undefined,
    stripePaymentMethod: undefined,
    stripePaymentStatus: undefined,
  };
};
