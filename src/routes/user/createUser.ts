import { FastifyInstance, FastifyReply } from 'fastify';
import { knexController } from '../../database/database';
import {
  User,
  userResponse,
  createUserRequestBody,
  CreateUserRequest,
} from '../../types/user.types';
import { hashPassword } from '../../lib/auth';
import { log } from '../../lib/log';
import { errorHandler } from '../../lib/errorHandler';

const schema = {
  description: 'Creates a user',
  tags: ['User'],
  body: createUserRequestBody,
  response: {
    201: userResponse,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    409: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: CreateUserRequest,
  reply: FastifyReply
): Promise<void> => {
  const emailCount: number = await knexController<User>('user')
    .count('email')
    .where('email', request.body.email)
    .first()
    .then((row: { 'count(`email`)': number }) => Number(row['count(`email`)']));

  if (emailCount > 0) {
    log.debug('Tried to create user with duplicate email');
    return errorHandler(
      reply,
      409,
      'Tried to create user with duplicate email'
    );
  }

  const hashObj = await hashPassword(request.body.password);

  await knexController('user').insert({
    email: request.body.email,
    forename: request.body.forename,
    surname: request.body.surname,
    is_admin: false,
    is_blender: false,
    salt: hashObj.salt,
    password_hash: hashObj.hash,
  });

  // This is stupid way to get inserted data.
  // Too bad that mysql dialect doesn't have RETURNING clause.
  // Ultimate race condition stuff
  // TODO: fix
  const createdUser = await knexController('user')
    .select(
      'id',
      'email',
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender'
    )
    .where({ email: request.body.email });

  return reply.code(201).send(...createdUser);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
