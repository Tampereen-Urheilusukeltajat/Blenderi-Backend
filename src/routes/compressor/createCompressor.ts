import { FastifyInstance, FastifyReply } from 'fastify';
import { knexController } from '../../database/database';
import {
  compressor,
  createCompressorRequestBody,
  CreateCompressorRequest,
} from '../../types/compressor.types';
import { errorHandler } from '../../lib/utils/errorHandler';
import { getUserWithId } from '../../lib/queries/user';

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

  const sql =
    'INSERT INTO compressor (name, description, is_enabled) VALUES (?,?, ?) RETURNING id';
  const params = [request.body.name, request.body.description, true];

  // Type source: Akzu404
  const res = await knexController.raw<Array<Array<{ id: number }>>>(
    sql,
    params
  );
  const [[{ id: insertedCompressorId }]] = res;

  return reply.code(201).send({
    ...request.body,
    id: insertedCompressorId,
    isEnabled: true,
  });
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
