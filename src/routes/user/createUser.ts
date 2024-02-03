import { FastifyInstance, FastifyReply } from 'fastify';
import { knexController } from '../../database/database';
import {
  userResponse,
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
import { getUserWithEmail } from '../../lib/queries/user';
import { validateTurnstileToken } from '../../lib/auth/turnstile';

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
  const turnstileValidationSuccess = await validateTurnstileToken(
    request.body.turnstileToken,
    request.ip
  );

  if (!turnstileValidationSuccess) {
    return errorHandler(reply, 403, 'Turnstile validation failed');
  }

  if (await emailAlreadyExists(request.body.email)) {
    const msg = 'Tried to create user with duplicate email';
    log.debug(msg);
    return errorHandler(reply, 409, msg);
  }

  if (await phoneAlreadyExists(request.body.phoneNumber)) {
    const msg = 'Tried to create user with duplicate phone number';
    log.debug(msg);
    return errorHandler(reply, 409, msg);
  }

  const hashObj = await hashPassword(request.body.password);

  const trx = await knexController.transaction();

  await trx('user').insert({
    email: request.body.email,
    phone_number: request.body.phoneNumber,
    forename: request.body.forename,
    surname: request.body.surname,
    salt: hashObj.salt,
    password_hash: hashObj.hash,
  });

  // This is stupid way to get inserted data.
  // Too bad that mysql dialect doesn't have RETURNING clause.
  // Ultimate race condition stuff
  // TODO: fix
  const createdUser = await getUserWithEmail(request.body.email, false, trx);

  await trx.commit();
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
