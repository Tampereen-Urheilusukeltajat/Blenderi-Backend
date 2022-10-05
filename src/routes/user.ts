import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';

const userAddedResponse = Type.Object({
  status: Type.String(),
});

export type UserAddedResponse = Static<typeof userAddedResponse>;

const schema = {
  description: 'Add new user or return error if add is not successful',
  summary: 'Add user',
  tags: ['User'],
  body: {
    type: 'object',
    required: ['email', 'forename', 'surname', 'password'],
    properties: {
      email: {
        type: 'string',
      },
      forename: {
        type: 'string',
      },
      surname: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
    },
  },
  response: {
    201: {
      description: 'User added',
      type: 'null',
    },
    409: {
      description: 'Email already in use',
      type: 'null',
    },
    500: {
      description: 'Server error',
      type: 'null',
    },
  },
};

const handler = async (
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // TODO: validate and verify stuff
  reply.code(201);
  await reply.send();
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/user',
    handler,
    schema,
  });
};
