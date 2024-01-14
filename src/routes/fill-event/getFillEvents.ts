import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type } from '@sinclair/typebox';
import { getFillEventsResponse } from '../../types/fillEvent.types';
import { getFillEvents } from '../../lib/queries/fillEvent';
import { paymentStatus } from '../../types/payment.types';

const schema = {
  description: 'Get diving cylinder fill events',
  tags: ['Fill event'],
  query: {
    type: 'object',
    properties: {
      paymentStatus,
    },
  },
  response: {
    200: Type.Array(getFillEventsResponse),
    401: { $ref: 'error' },
    403: { $ref: 'error' },
  },
};

const handler = async (
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const fills = await getFillEvents(req.user.id);
  return reply.send(fills);
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
