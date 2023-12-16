import { FastifyInstance, FastifyReply } from 'fastify';
import {
  compressor,
  createCompressorRequestBody,
  CreateCompressorRequest,
} from '../../types/compressor.types';
import { errorHandler } from '../../lib/utils/errorHandler';
import { getUserWithId } from '../../lib/queries/user';
import { createCompressor } from '../../lib/queries/compressors';

const schema = {
  description: 'Creates a user',
  tags: ['Compressor'],
  body: createCompressorRequestBody,
  response: {
    201: compressor,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    409: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: CreateCompressorRequest,
  reply: FastifyReply
): Promise<void> => {
  const user = await getUserWithId(request.user.id, true);

  if (user === undefined) return errorHandler(reply, 500);
  if (!user.isAdmin) {
    return errorHandler(reply, 403, 'User is not an admin');
  }
  const newCompressor = await createCompressor(request);

  return reply.code(201).send(newCompressor);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
