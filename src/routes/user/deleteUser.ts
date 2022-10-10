import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { knexController } from '../../database/database';
import {
  userIdParamsPayload,
  UserIdParamsPayload,
} from '../../types/user.types';

const deleteUserReply = Type.Object({
  userId: Type.String(),
  deletedAt: Type.String(),
});

const schema = {
  description: 'Delete (anonymize) user with given userId',
  summary: 'Delete user',
  tags: ['User'],
  params: userIdParamsPayload,
  response: {
    200: deleteUserReply,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    404: { $ref: 'error' },
  },
};

const handler = async (
  req: FastifyRequest<{ Params: UserIdParamsPayload }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization
  const userId: string = req.params.userId;
  const result = await knexController('user').where({ id: userId }).update({
    email: null,
    forename: null,
    surname: null,
    is_admin: false,
    is_blender: false,
    deleted_at: knexController.fn.now(),
  });
  if (result === 0) {
    return reply.code(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'User not found.',
    });
  }
  const user = await knexController('user')
    .where({ id: userId })
    .select('id as userId', 'deleted_at as deletedAt');
  return reply.code(200).send(...user);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'DELETE',
    url: '/user/delete/:userId',
    handler,
    schema,
  });
};
