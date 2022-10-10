import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { knexController } from '../../database/database';
import {
  userIdParamsPayload,
  UserIdParamsPayload,
} from '../../types/user.types';

const archiveUserReply = Type.Object({
  userId: Type.String(),
  archivedAt: Type.String(),
});
type ArchiveUserReply = Static<typeof archiveUserReply>;

const schema = {
  description: 'Archive user with given userId',
  summary: 'Archive user',
  tags: ['User'],
  params: userIdParamsPayload,
  response: {
    200: archiveUserReply,
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
    archived_at: knexController.fn.now(),
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
    .select('id as userId', 'archived_at as archivedAt');
  return reply.code(200).send(...user);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'DELETE',
    url: '/user/:userId',
    handler,
    schema,
  });
};
