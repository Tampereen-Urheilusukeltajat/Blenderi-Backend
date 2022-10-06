import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { knexController } from '../../database/database';

const editUserResponse = Type.Object({
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  password: Type.String(),
});

export type EditUserResponse = Static<typeof editUserResponse>;

// Expected request type
interface User {
  email: string;
  forename: string;
  surname: string;
  password: string;
}

const editUserSchema = {
  description: 'Edit data of already existing user.',
  summary: 'Edit user',
  tags: ['User'],
  body: {
    type: 'object',
    required: ['email', 'password', 'forename', 'surname'],
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
    200: editUserResponse,
  },
};

const editUserHandler = async (
  req: FastifyRequest<{ Body: User }>,
  reply: FastifyReply
): Promise<void> => {
  const { email, password, forename, surname } = req.body;

  // TODO password hash

  // edit user (TODO edit email?)
  const editResponse = await knexController('user')
    .where({ email })
    .update({ password_hash: password, forename, surname });

  // If no user found with given email.
  if (editResponse === 0) {
    // TODO
    throw new Error('No user found with given email.');
  }

  // get edited user
  const editedUser = await knexController
    .select('email', 'password_hash as password', 'forename', 'surname')
    .from<User>('user')
    .where({ email });

  await reply.send(...editedUser);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'PUT',
    url: '/user/',
    handler: editUserHandler,
    schema: editUserSchema,
  });
};
