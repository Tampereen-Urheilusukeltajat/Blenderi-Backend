import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const schema = {
  tags: ['Auth'],
  body: {},
  response: {
    201: {},
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  return reply.code(201).send();
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/stripe/payment-intent/',
    handler,
    schema,
  });
};
