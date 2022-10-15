import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';

import {
  User,
  userResponse,
  UserResponse,
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
  // TODO: Don't return if user is archived or deleted
  const userId = req.params.userId;
  const user: UserResponse = await knexController<User>('user')
    .where('id', userId)
    .first(
      'email',
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender'
    );
  if (user === undefined) {
    await reply.code(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'User was not found with given userId',
    });
  }
  await reply.send(user);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/:userId',
    handler,
    schema,
  });
};
