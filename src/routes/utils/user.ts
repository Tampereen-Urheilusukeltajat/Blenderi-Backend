import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { User, editUserResponse } from '../../types/user.types';

import bcrypt from 'bcrypt';

// Expected request type

const editUserSchema = {
  description: 'Edit data of already existing user.',
  summary: 'Edit user',
  tags: ['User'],
  body: {
    type: 'object',
    required: [
      'id',
      'email',
      'password',
      'salt',
      'forename',
      'surname',
      'blender',
      'admin',
    ],
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
      admin: {
        type: 'boolean',
      },
      blender: {
        type: 'boolean',
      },
      salt: {
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

const hashPassword = async (
  password: string
): Promise<{ hash: string; salt: string }> => {
  const saltRounds = 10;

  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);

  return { hash, salt };
};

const editUserHandler = async (
  req: FastifyRequest<{ Body: User }>,
  reply: FastifyReply
): Promise<void> => {
  const { email, password, forename, surname } = req.body;

  // hash password.
  const hashObj = await hashPassword(password);

  // edit user (TODO edit email?)
  const editResponse = await knexController('user').where({ email }).update({
    password_hash: hashObj.hash,
    forename,
    surname,
    salt: hashObj.salt,
  });

  // If no user found with given email.
  if (editResponse === 0) {
    throw new Error('No user found with given email.');
  }

  // get edited user
  const editedUser = await knexController
    .select('id', 'email', 'forename', 'surname', 'admin', 'blender')
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
