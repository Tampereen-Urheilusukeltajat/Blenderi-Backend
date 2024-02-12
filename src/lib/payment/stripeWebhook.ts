import Stripe from 'stripe';
import { log } from '../utils/log';
import { updatePaymentEventStatus } from '../queries/paymentQueries';
import { PaymentStatus } from '../../types/payment.types';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
if (!STRIPE_WEBHOOK_SECRET)
  throw new Error('Missing env variable "STRIPE_WEBHOOK_SECRET"');
if (!STRIPE_API_KEY) throw new Error('Missing env variable "STRIPE_API_KEY"');

const stripeApi = new Stripe(STRIPE_API_KEY, { typescript: true });

export const constructEvent = async (
  signature: string,
  event: string
): Promise<Stripe.Event> =>
  stripeApi.webhooks.constructEvent(event, signature, STRIPE_WEBHOOK_SECRET);

const processPaymentIntentWebhookEvent = async (
  paymentIntent: Stripe.PaymentIntent,
  eventType: Stripe.Event.Type
): Promise<void> => {
  const paymentEventId = paymentIntent.metadata.payment_event_id;
  if (!paymentEventId)
    throw new Error('Payment event id not saved to the metadata');

  // We currently only process some of the payment event types
  switch (eventType) {
    case 'payment_intent.succeeded':
      await updatePaymentEventStatus(paymentEventId, PaymentStatus.completed);
      break;
    case 'payment_intent.processing':
      await updatePaymentEventStatus(paymentEventId, PaymentStatus.inProgress);
      break;
    case 'payment_intent.payment_failed':
      await updatePaymentEventStatus(paymentEventId, PaymentStatus.failed);
      break;
  }
};

const processChargeDisputeWebhookEvent = async (
  fraudDetails: Stripe.Dispute,
  eventType: Stripe.Event.Type
): Promise<void> => {
  // TODO Handle
};

export const processWebhookEvent = async (
  event: Stripe.Event
): Promise<void> => {
  switch (event.type) {
    case 'payment_intent.succeeded':
    case 'payment_intent.canceled':
    case 'payment_intent.processing':
    case 'payment_intent.requires_action':
    case 'payment_intent.payment_failed':
    case 'payment_intent.amount_capturable_updated':
    case 'payment_intent.created':
    case 'payment_intent.partially_funded':
      await processPaymentIntentWebhookEvent(event.data.object, event.type);
      break;
    case 'charge.dispute.closed':
    case 'charge.dispute.created':
    case 'charge.dispute.funds_reinstated':
    case 'charge.dispute.funds_withdrawn':
    case 'charge.dispute.updated':
      await processChargeDisputeWebhookEvent(event.data.object, event.type);
      break;
    default:
      log.warn(`Unhandled event type ${event.type}.`);
  }
};
