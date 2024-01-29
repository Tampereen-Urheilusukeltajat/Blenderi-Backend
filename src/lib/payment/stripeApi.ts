import { UserResponse } from '../../types/user.types';
import {
  calculateFillEventTotalPrice,
  getFillEventsForPaymentEvent,
} from '../queries/paymentQueries';
import Stripe from 'stripe';
import { createStripePaymentIntent } from '../queries/stripeQueries';
import { log } from '../utils/log';

const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
if (!STRIPE_API_KEY) throw new Error('Stripe api key missing');

const stripeApi = new Stripe(STRIPE_API_KEY, { typescript: true });

const cancelPaymentIntent = async (
  paymentIntentId: string,
  cancellationReason: Stripe.PaymentIntentCancelParams.CancellationReason
): Promise<void> => {
  log.info(
    `Canceling payment intent ${paymentIntentId} with the reason '${cancellationReason}'`
  );
  await stripeApi.paymentIntents.cancel(paymentIntentId, {
    cancellation_reason: cancellationReason,
  });
  log.info(`Cancellation of ${paymentIntentId} was a success.`);
};

export const createPaymentIntent = async (
  paymentEventId: string,
  user: UserResponse
): Promise<Stripe.PaymentIntent> => {
  const fillEvents = await getFillEventsForPaymentEvent(paymentEventId);
  const totalCost = await calculateFillEventTotalPrice(fillEvents);

  if (totalCost < 50) {
    throw new Error(
      `Minimium charge amount is 0,50 €. Tried to charge ${totalCost} cents`
    );
  }

  const paymentIntent = await stripeApi.paymentIntents.create({
    amount: totalCost,
    currency: 'eur',
    customer: user.id,
    receipt_email: user.email,
  });

  // If inserting payment intent info to database fails, cancel the payment intent
  try {
    await createStripePaymentIntent(paymentEventId, paymentIntent);
  } catch (error) {
    log.error(
      `Creating database entry for stripe payment failed. 

      PaymentEventId: ${paymentEventId} 
      PaymentIntentId: ${paymentIntent.id}
      `
    );
    await cancelPaymentIntent(paymentIntent.id, 'abandoned');
    throw new Error('Creating database entry for stripe payment failed');
  }

  return paymentIntent;
};

export const getPaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  const paymentIntent = await stripeApi.paymentIntents.retrieve(
    paymentIntentId
  );

  if (!paymentIntent)
    throw new Error(`Payment intent ${paymentIntentId} not found`);

  return paymentIntent;
};
