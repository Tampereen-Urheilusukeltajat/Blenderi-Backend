import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { UserResponse, userResponse } from '../../types/user.types';
import { selectNotArchivedUsers, selectUsers } from '../../lib/queries/user';

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
    200: Type.Array(userResponse),
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
  let users: UserResponse[];
  includeArchived
    ? (users = await selectUsers())
    : (users = await selectNotArchivedUsers());
  await reply.send(users);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/',
    handler,
    schema,
  });
};
