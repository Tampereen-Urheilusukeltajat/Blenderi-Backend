import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { Type, Static } from '@sinclair/typebox';

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
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' },
    },
  },
  response: {
    200: userSearchResponse,
    401: { $ref: 'error' },
    404: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization check
  await reply.send({
    email: 'hi@world.fi',
    firstName: 'Erkki',
    lastName: 'Esimerkki',
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/user',
    handler,
    schema: searchSchema,
  });
};
