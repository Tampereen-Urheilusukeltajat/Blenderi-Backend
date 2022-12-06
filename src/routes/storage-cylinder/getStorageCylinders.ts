import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getStorageCylinders } from '../../lib/storageCylinder';
import { storageCylinder } from '../../types/storageCylinder.types';
import { Type } from '@sinclair/typebox';

const schema = {
  description: 'Get storage cylinders',
  tags: ['Storage cylinder'],
  response: {
    200: Type.Array(storageCylinder),
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const storageCylinders = await getStorageCylinders();

  return reply.code(200).send(storageCylinders);
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
