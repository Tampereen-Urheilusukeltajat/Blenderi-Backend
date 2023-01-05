import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { errorHandler } from '../../lib/errorHandler';
import { createGasPrice, getGasById } from '../../lib/gas';
import {
  createGasPriceBody,
  CreateGasPriceBody,
  enrichedGas,
} from '../../types/gas.types';

const schema = {
  desription: 'Create gas price',
  tags: ['gas price'],
  body: createGasPriceBody,
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
    Body: CreateGasPriceBody;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const gasExists = await getGasById(request.body.gasId);
  if (!gasExists) return errorHandler(reply, 400, 'Gas does not exist');

  const enrichedGas = await createGasPrice(request.body);

  return reply.code(201).send(enrichedGas);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/price',
    // TODO Only admin users can create gas prices
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
