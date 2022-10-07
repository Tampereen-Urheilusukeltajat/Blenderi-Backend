import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { knexController } from '../../database/database';

import userTypes, { User, UserResponse } from '../../types/user.types';
const { userResponse } = userTypes;

const searchParamsPayload = Type.Object({
  userId: Type.String(),
});
type SearchParamsPayload = Static<typeof searchParamsPayload>;

const fetchAllResponse = Type.Array(userResponse);

const searchSchema = {
  description: 'Search for an user with given id',
  summary: 'Search user',
  tags: ['User'],
  params: searchParamsPayload,
  response: {
    200: userResponse,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    404: { $ref: 'error' },
  },
};

const fetchAllSchema = {
  description: 'Fetch all users',
  summary: 'Fetch all users',
  tags: ['User'],
  response: {
    200: fetchAllResponse,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
  },
};

const searchUserHandler = async (
  req: FastifyRequest<{
    Params: SearchParamsPayload;
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
    throw new Error('User was not found');
  }
  await reply.send(user);
};

const fetchAllHandler = async (
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization
  const users = await knexController<User>('user').select(
    'email',
    'forename',
    'surname',
    'is_admin as isAdmin',
    'is_blender as isBlender'
  );
  await reply.send(users);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/user',
    handler: fetchAllHandler,
    schema: fetchAllSchema,
  });
  fastify.route({
    method: 'GET',
    url: '/user/:userId',
    handler: searchUserHandler,
    schema: searchSchema,
  });
};
