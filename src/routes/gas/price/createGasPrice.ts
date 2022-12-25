import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateGasPrice,
  createGasPrice,
  enrichedGas,
} from '../../../types/gas.types';

const schema = {
  desription: 'Create gas price',
  tags: ['gas price'],
  body: createGasPrice,
  response: {
    201: enrichedGas,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    409: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Body: CreateGasPrice;
  }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO

  return reply.send({});
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    // TODO Only admin users can create gas prices
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
