import { FastifyInstance, FastifyReply } from 'fastify';
import { knexController } from '../../database/database';
import {
  userResponse,
  UserResponse,
  createUserRequestBody,
  CreateUserRequest,
} from '../../types/user.types';
import { hashPassword } from '../../lib/auth/auth';
import { log } from '../../lib/utils/log';
import { errorHandler } from '../../lib/utils/errorHandler';
import {
  phoneAlreadyExists,
  emailAlreadyExists,
} from '../../lib/utils/collisionChecks';

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
  if (await emailAlreadyExists(request.body.email)) {
    const msg = 'Tried to create user with duplicate email';
    log.debug(msg);
    return errorHandler(reply, 409, msg);
  }

  if (await phoneAlreadyExists(request.body.phone)) {
    const msg = 'Tried to create user with duplicate phone number';
    log.debug(msg);
    return errorHandler(reply, 409, msg);
  }

  const hashObj = await hashPassword(request.body.password);

  await knexController('user').insert({
    email: request.body.email,
    phone: request.body.phone,
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
    .select<UserResponse[]>(
      'id',
      'email',
      'phone',
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender',
      'archived_at as archivedAt'
    )
    .where({ email: request.body.email })
    .first();

  return reply.code(201).send(createdUser);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
