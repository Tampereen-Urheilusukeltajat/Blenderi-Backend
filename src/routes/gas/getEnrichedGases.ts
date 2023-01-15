import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { enrichedGas } from '../../types/gas.types';
import { Type } from '@sinclair/typebox';
import { getEnrichedGases } from '../../lib/gas';

const schema = {
  description: 'Get enriched gases',
  tags: ['gas price'],
  response: {
    201: Type.Array(enrichedGas),
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    409: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const enrichedGases = await getEnrichedGases();

  return reply.send(enrichedGases);
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
