import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { knexController } from '../../database/database';

import { User, userResponse } from '../../types/user.types';

const fetchAllResponse = Type.Array(userResponse);

const includeArchived = Type.Object({
  includeArchived: Type.Boolean({ default: false }),
});
type IncludeArchived = Static<typeof includeArchived>;

const schema = {
  description: 'Fetch all users',
  summary: 'Fetch all users',
  query: includeArchived,
  tags: ['User'],
  response: {
    200: fetchAllResponse,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
  },
};

const handler = async (
  req: FastifyRequest<{ Querystring: IncludeArchived }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization
  const { includeArchived } = req.query;

  const result = await knexController<User>('user')
    .where('deleted_at', null)
    .select(
      'id as userId',
      'email',
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender',
      'archived_at as archivedAt'
    );
  includeArchived
    ? await reply.send(result)
    : await reply.send(result.filter((user) => user.archivedAt === null));
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/user',
    handler,
    schema,
  });
};
