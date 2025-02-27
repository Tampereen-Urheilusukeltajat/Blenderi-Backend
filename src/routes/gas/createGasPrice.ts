import {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import { errorHandler } from '../../lib/utils/errorHandler';
import { createGasPrice, getGasById } from '../../lib/queries/gas';
import {
  createGasPriceBody,
  type CreateGasPriceBody,
  gasWithPricing,
} from '../../types/gas.types';

const schema = {
  description: 'Create gas price',
  tags: ['gas price'],
  body: createGasPriceBody,
  response: {
    201: gasWithPricing,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Body: CreateGasPriceBody;
  }>,
  reply: FastifyReply,
): Promise<void> => {
  const gasExists = await getGasById(request.body.gasId);
  if (!gasExists) return errorHandler(reply, 400, 'Gas does not exist');

  const gasWithPricing = await createGasPrice(request.body);

  return reply.code(201).send(gasWithPricing);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/price',
    preValidation: [fastify['authenticate'], fastify['admin']],
    handler,
    schema,
  });
};
