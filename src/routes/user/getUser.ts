import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/errorHandler';
import {
  userResponse,
  User,
  userIdParamsPayload,
  UserIdParamsPayload,
} from '../../types/user.types';

const schema = {
  description: 'Get user with given id',
  summary: 'Get user',
  tags: ['User'],
  params: userIdParamsPayload,
  response: {
    200: userResponse,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    404: { $ref: 'error' },
  },
};

const handler = async (
  req: FastifyRequest<{
    Params: UserIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization check
  const userId = req.params.userId;
  const user: User = await knexController<User>('user')
    .where('id', userId)
    .whereNull('archived_at')
    .whereNull('deleted_at')
    .first(
      'id',
      'email',
      'phone',
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender',
      'archived_at as archivedAt',
      'deleted_at as deletedAt'
    );
  if (user === undefined) {
    return errorHandler(reply, 404, 'User not found.');
  }
  await reply.send(user);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/:userId',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
