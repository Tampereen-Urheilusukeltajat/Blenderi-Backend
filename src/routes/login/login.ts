import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { passwordIsValid } from '../../lib/auth';
import { createClient } from 'redis';
import { v4 as uuid } from 'uuid';
import { errorHandler } from '../../lib/errorHandler';
import {
  REFRESH_TOKEN_EXPIRE_TIME,
  ACCESS_TOKEN_EXPIRE_TIME,
} from '../../lib/jwtUtils';

// REMOVE
const redis = createClient();

const schema = {
  description: 'login',
  tags: ['Auth'],
  body: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      password: { type: 'string' },
    },
    required: ['email', 'password'],
  },
  response: {
    200: {
      description: 'Logged in',
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
    400: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async function (
  request: FastifyRequest<{
    Body: {
      email: 'string';
      password: 'string';
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  await redis.connect();

  const result: { id: 'String'; salt: 'String'; password_hash: 'String' } =
    await knexController('user')
      .where('email', request.body.email)
      .first('id', 'salt', 'password_hash');

  if (
    !(await passwordIsValid(
      request.body.password,
      result.password_hash,
      result.salt
    ))
  ) {
    return errorHandler(reply, 401);
  }

  const refreshTokenId: string = uuid();

  const accessToken = this.jwt.sign(
    { id: result.id },
    { expiresIn: ACCESS_TOKEN_EXPIRE_TIME }
  );

  const refreshToken = this.jwt.sign(
    { id: result.id },
    { expiresIn: REFRESH_TOKEN_EXPIRE_TIME, jti: refreshTokenId }
  );
  await redis.set(result.id + ':' + refreshTokenId, refreshToken, {
    EX: REFRESH_TOKEN_EXPIRE_TIME,
  });
  await redis.disconnect();
  return reply.code(200).send({ accessToken, refreshToken });

  await redis.disconnect();
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
