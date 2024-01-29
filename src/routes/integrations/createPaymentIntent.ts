import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createPaymentIntent } from '../../lib/payment/stripeApi';
import {
  CreatePaymentIntentReply,
  CreatePaymentIntentRequest,
  createPaymentIntentReply,
  createPaymentIntentRequest,
} from '../../types/stripe.types';
import { getUserWithId } from '../../lib/queries/user';
import { errorHandler } from '../../lib/utils/errorHandler';
import { getPaymentEvent } from '../../lib/queries/paymentQueries';

const schema = {
  tags: ['Stripe'],
  body: createPaymentIntentRequest,
  response: {
    201: createPaymentIntentReply,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{ Body: CreatePaymentIntentRequest }>,
  reply: FastifyReply
): Promise<void> => {
  const { id } = request.user;
  const { paymentEventId } = request.body;

  const user = await getUserWithId(id, true);
  if (!user) {
    return errorHandler(reply, 500);
  }

  const paymentEvent = await getPaymentEvent(paymentEventId, user.id);
  if (paymentEvent?.stripePaymentClientSecret) {
    return errorHandler(
      reply,
      400,
      'Payment intent already exists for the payment event'
    );
  }

  const paymentIntent = await createPaymentIntent(paymentEventId, user);

  const payload: CreatePaymentIntentReply = {
    amountDueInEurCents: paymentIntent.amount,
    clientSecret: paymentIntent.client_secret ?? undefined,
    paymentEventId,
    paymentIntentId: paymentIntent.id,
  };

  return reply.code(201).send(payload);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/stripe/payment-intent/',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
