import { Type } from '@sinclair/typebox';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getPaymentEvents } from '../../lib/queries/paymentQueries';
import { paymentEvent } from '../../types/payment.types';

const schema = {
  tags: ['Payment'],
  response: {
    200: Type.Array(paymentEvent),
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

  const paymentEvents = await getPaymentEvents(userId);

  return reply.code(200).send(paymentEvents);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
