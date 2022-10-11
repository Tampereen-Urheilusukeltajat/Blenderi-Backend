import { FastifyInstance } from 'fastify';
import { knexController } from '../../database/database';
import {
  User,
  userResponse,
  createUserRequestBody,
  CreateUserRequest,
  CreateUserReply,
  DatabaseError,
} from '../../types/user.types';
import { hashPassword } from '../../lib/auth';
import { log } from '../../lib/log';

const schema = {
  description: 'Create new user or return an error if add was not successful',
  summary: 'Create user',
  tags: ['User'],
  body: {
    type: 'object',
    required: createUserRequestBody.required,
    properties: createUserRequestBody.static,
  },
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
  reply: CreateUserReply
): Promise<void> => {
  // TODO: Add email unique constraint to user table and remove
  // this duplicate email check
  const emailCount: number = await knexController<User>('user')
    .count('email')
    .where('email', request.body.email)
    .first()
    .then((row: { 'count(`email`)': number }) => Number(row['count(`email`)']));

  if (emailCount > 0) {
    log.info('Tried to create user with duplicate email');
    await reply.code(409);
    await reply.send();
    return;
  }

  const hashObj = await hashPassword(request.body.password);

  try {
    await knexController('user').insert({
      email: request.body.email,
      forename: request.body.forename,
      surname: request.body.surname,
      is_admin: false,
      is_blender: false,
      salt: hashObj.salt,
      password_hash: hashObj.hash,
    });
  } catch (err: unknown) {
    const dbError = err as DatabaseError;
    if (dbError.code === 'ER_DUP_ENTRY') {
      log.info('Tried to create user with duplicate email');
      await reply.code(409);
      await reply.send();
      return;
    }
    throw err;
  }

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

  await reply.code(201);
  await reply.send(...createdUser);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
