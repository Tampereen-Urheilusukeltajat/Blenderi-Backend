import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { gasWithPricing } from '../../types/gas.types';
import { Type } from '@sinclair/typebox';
import { getEnrichedGases } from '../../lib/gas';

const schema = {
  desription: 'Get enriched gases',
  tags: ['gas'],
  response: {
    201: Type.Array(gasWithPricing),
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
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
