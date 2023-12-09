import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { compressor } from '../../types/compressor.types';
import { Type } from '@sinclair/typebox';
import { knexController } from '../../database/database';

const schema = {
  description: 'Get compressors',
  tags: ['Compressor'],
  response: {
    200: Type.Array(compressor),
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const compressors = await knexController('compressor').select(
    'id',
    'name',
    'description',
    'is_enabled AS isEnabled'
  );

  return reply.code(200).send(compressors);
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
