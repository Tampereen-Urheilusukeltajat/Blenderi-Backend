import { FastifyInstance, FastifyReply } from 'fastify';
import { knexController } from '../../database/database';
import { passwordIsValid } from '../../lib/auth';
import { v4 as uuid } from 'uuid';
import { errorHandler } from '../../lib/errorHandler';
import {
  initializeRefreshTokenRotationSession,
  REFRESH_TOKEN_EXPIRE_TIME,
  ACCESS_TOKEN_EXPIRE_TIME,
  EXAMPLE_JWT,
} from '../../lib/jwtUtils';
import {
  loginRequestBody,
  LoginRequest,
  authResponse,
} from '../../types/auth.types';

const schema = {
  tags: ['Auth'],
  body: loginRequestBody,
  response: {
    200: authResponse,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

schema.body.properties.email.example = 'john.doe@example.com';
schema.body.properties.password.example = 'rockyou.txt';
schema.response['200'].properties.accessToken.example = EXAMPLE_JWT;
schema.response['200'].properties.refreshToken.example = EXAMPLE_JWT;

const handler = async function (
  request: LoginRequest,
  reply: FastifyReply
): Promise<void> {
  const userInfo: {
    id: 'String';
    password_hash: 'String';
    archivedAt: string | null;
  } = await knexController('user')
    .where('email', request.body.email)
    .first('id', 'password_hash', 'archived_at as archivedAt');

  if (userInfo === undefined) {
    // This means that user doesn't exist, we are not going to tell that to the client.
    return errorHandler(reply, 401);
  }

  if (userInfo.archivedAt !== null) {
    // User is archived, don't allow login
    return errorHandler(reply, 401);
  }

  const isPasswordValid = await passwordIsValid(
    request.body.password,
    userInfo.password_hash
  );

  if (!isPasswordValid) {
    return errorHandler(reply, 401);
  }

  const accessToken = this.jwt.sign(
    { id: userInfo.id },
    { expiresIn: ACCESS_TOKEN_EXPIRE_TIME }
  );

  const refreshTokenId: string = uuid();

  const refreshToken = this.jwt.sign(
    { id: userInfo.id, isRefreshToken: true },
    { expiresIn: REFRESH_TOKEN_EXPIRE_TIME, jti: refreshTokenId }
  );

  await initializeRefreshTokenRotationSession(
    userInfo.id,
    refreshTokenId,
    refreshToken
  );

  return reply.code(200).send({ accessToken, refreshToken });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
