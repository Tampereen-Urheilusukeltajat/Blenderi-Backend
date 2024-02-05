import {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import {
  calculateFillEventTotalPrice,
  createPaymentEvent,
  getPaymentEvent,
  getUnpaidFillEventsForUser,
} from '../../lib/queries/paymentQueries';
import { errorHandler } from '../../lib/utils/errorHandler';
import { paymentEvent } from '../../types/payment.types';

const schema = {
  tags: ['Payment'],
  body: {},
  response: {
    201: paymentEvent,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: userId } = request.user;

  // For now automatically just get all unpaid fill events. In the future,
  // we might want to offer the possibility to pay only some events etc
  const unpaidFillEvents = await getUnpaidFillEventsForUser(userId);
  if (unpaidFillEvents.length === 0) {
    return errorHandler(reply, 400, 'Nothing due');
  }
  const totalCost = await calculateFillEventTotalPrice(unpaidFillEvents);
  if (totalCost < 50) {
    return errorHandler(reply, 400, 'Minimium charge amount is 0,50 €');
  }

  const paymentEventId = await createPaymentEvent(userId, unpaidFillEvents);

  const paymentEvent = await getPaymentEvent(paymentEventId, userId);

  return reply.code(201).send(paymentEvent);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
