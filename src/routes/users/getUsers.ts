import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type } from '@sinclair/typebox';
import { knexController } from '../../database/database';

import userTypes, { User } from '../../types/user.types';
const { userResponse } = userTypes;

const fetchAllResponse = Type.Array(userResponse);

const schema = {
  description: 'Fetch all users',
  summary: 'Fetch all users',
  tags: ['User'],
  response: {
    200: fetchAllResponse,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
  },
};

const handler = async (
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
    handler,
    schema,
  });
};
