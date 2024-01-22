import Stripe from 'stripe';
import { knexController } from '../../database/database';

export const createStripePaymentIntent = async (
  paymentEventId: string,
  paymentIntent: Stripe.PaymentIntent
): Promise<string> => {
  const { amount, id, status } = paymentIntent;
  const res = await knexController.raw<Array<Array<{ id: string }>>>(
    `
    INSERT INTO stripe_payment_intent (
      payment_event_id, 
      payment_intent_id, 
      amount_eur_cents, 
      status
    )
    VALUES (?, ?, ?, ?)
    RETURNING id
  `,
    [paymentEventId, id, amount, status]
  );

  const [[{ id: insertedPaymentIntentId }]] = res;

  if (!id) throw new Error('Inserting Stripe payment intent failed');

  return insertedPaymentIntentId;
};
