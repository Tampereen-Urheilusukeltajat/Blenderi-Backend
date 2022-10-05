import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';

const editUserResponse = Type.Object({
  email: Type.String(),
  firstName: Type.String(),
  lastName: Type.String(),
  password: Type.String(),
});

export type EditUserResponse = Static<typeof editUserResponse>;

// Expected request type
interface IQuerystring {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

const schema = {
  description: 'Edit data of already existing user.',
  summary: 'Edit user',
  tags: ['User'],
  body: {
    type: 'object',
    required: ['email', 'firstName', 'lastName', 'password'],
    properties: {
      email: {
        type: 'string',
      },
      firstName: {
        type: 'string',
      },
      lastName: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
    },
  },
  response: {
    200: editUserResponse,
  },
};

const handler = async (
  req: FastifyRequest<{ Body: IQuerystring }>,
  reply: FastifyReply
): Promise<void> => {
  try {
    // TODO validate request

    const { email, password, firstName, lastName } = req.body;

    // TODO edit user

    await reply.send({
      email,
      firstName,
      lastName,
      password,
    });
  } catch (error) {
    console.log('TODO error');
  }
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'PUT',
    url: '/user',
    handler,
    schema,
  });
};
