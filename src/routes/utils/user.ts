import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { knexController } from '../../database/database';

const user = Type.Object({
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  password: Type.String(),
});

export type User = Static<typeof user>;

// Expected request type
interface IQuerystring {
  email: string;
  forename: string;
  surname: string;
  password: string;
}

const schema = {
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
    200: user,
  },
  400: {
    $ref: 'error',
  },
  500: {
    $ref: 'error',
  },
};

const handler = async (
  req: FastifyRequest<{ Body: IQuerystring }>,
  reply: FastifyReply
): Promise<void> => {
  const { email, password, forename, surname } = req.body;

  // TODO password hash

  // edit user (TODO edit email?)
  const editResponse = await knexController('user')
    .where({ email })
    .update({ password_hash: password, forename, surname });

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
    url: '/user',
    handler,
    schema,
  });
};
