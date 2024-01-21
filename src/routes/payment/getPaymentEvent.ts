import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getPaymentEvent } from '../../lib/queries/paymentQueries';
import {
  PaymentEventIdParamsPayload,
  extendedPaymentEvent,
  paymentEventIdParamsPayload,
} from '../../types/payment.types';
import { errorHandler } from '../../lib/utils/errorHandler';

const schema = {
  tags: ['Payment'],
  params: paymentEventIdParamsPayload,
  response: {
    200: extendedPaymentEvent,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Params: PaymentEventIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const { id: userId } = request.user;
  const { paymentEventId } = request.params;

  const paymentEvent = await getPaymentEvent(paymentEventId, userId);
  if (paymentEvent === undefined) return errorHandler(reply, 404);

  return reply.code(200).send(paymentEvent);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/:paymentEventId',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
