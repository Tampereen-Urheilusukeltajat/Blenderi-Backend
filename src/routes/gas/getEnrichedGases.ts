import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { gasWithPricing } from '../../types/gas.types';
import { Type } from '@sinclair/typebox';
import { getGasesWithPricing } from '../../lib/queries/gas';

const schema = {
  description: 'Get enriched gases',
  tags: ['gas'],
  response: {
    200: Type.Array(gasWithPricing),
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
  const gasesWithPricing = await getGasesWithPricing();

  return reply.code(200).send(gasesWithPricing);
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
