import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  createPaymentEvent,
  getUnpaidFillEventsForUser,
} from '../../lib/queries/paymentQueries';
import { createPaymentEventReply } from '../../types/payment.types';
import { errorHandler } from '../../lib/utils/errorHandler';

const schema = {
  tags: ['Payment'],
  body: {},
  response: {
    201: createPaymentEventReply,
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

  const paymentEventId = await createPaymentEvent(userId, unpaidFillEvents);

  return reply.code(201).send({
    paymentEventId,
  });
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
