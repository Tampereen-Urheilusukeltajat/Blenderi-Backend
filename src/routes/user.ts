import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { Type, Static } from '@sinclair/typebox';

const typeboxParam = Type.Object({
  userId: Type.Optional(Type.String()),
});

export type TypeboxParam = Static<typeof typeboxParam>;

// TODO: Make another response type with more user information for admin view
const userSearchResponse = Type.Object({
  email: Type.String(),
  firstName: Type.String(),
  lastName: Type.String(),
});

export type UserSearchResponse = Static<typeof userSearchResponse>;

const searchSchema = {
  description: 'Search for an user with given id',
  summary: 'Search user',
  tags: ['User'],
  params: typeboxParam,
  response: {
    200: userSearchResponse,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    404: { $ref: 'error' },
  },
};

const searchUserHandler = async (
  req: FastifyRequest<{ Params: TypeboxParam }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization check
  // TODO: DB query

  const userId = req.params.userId;
  if (userId !== undefined) {
    await reply.send({
      email: `${userId}@hello.fi`,
      firstName: userId,
      lastName: 'Esimerkki',
    });
  }
  await reply.send({
    email: `toimiiko`,
    firstName: 'parametriton',
    lastName: 'path vihdoinkin??',
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  ['/user', '/user/:userId'].forEach((path) =>
    fastify.route({
      method: 'GET',
      url: path,
      handler: searchUserHandler,
      schema: searchSchema,
    })
  );
};
