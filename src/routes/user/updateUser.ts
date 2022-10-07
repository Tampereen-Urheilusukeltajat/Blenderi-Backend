import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { User, editUserResponse, user } from '../../types/user.types';

import bcrypt from 'bcrypt';

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
    properties: user.static,
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
  const { id, email, password, forename, surname, admin, blender } = req.body;

  const hashObj = await hashPassword(password);

  // edit user
  const editResponse = await knexController('user').where({ id }).update({
    email,
    forename,
    surname,
    password_hash: hashObj.hash,
    salt: hashObj.salt,
    admin,
    blender,
  });

  // If no user found with given id.
  if (editResponse === 0) {
    throw new Error('No user found with given email.');
  }

  // get edited user
  const editedUser = await knexController
    .select('id', 'email', 'forename', 'surname', 'admin', 'blender')
    .from<User>('user')
    .where({ id });

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
