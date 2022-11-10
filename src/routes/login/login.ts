import { FastifyInstance, FastifyReply } from 'fastify';
import { knexController } from '../../database/database';
import { passwordIsValid } from '../../lib/auth';
import { v4 as uuid } from 'uuid';
import { errorHandler } from '../../lib/errorHandler';
import {
  initializeRefreshTokenRotationSession,
  REFRESH_TOKEN_EXPIRE_TIME,
  ACCESS_TOKEN_EXPIRE_TIME,
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
schema.response['200'].properties.accessToken.example =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2YWx1ZSI6ImFjY2Vzc1Rva2VuIGV4YW1wbGUifQ.RhzwDe3kBpP4ZbwTXiSN3tQ9KtdZ6hGJwHdy9cJtAjo';
schema.response['200'].properties.refreshToken.example =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2YWx1ZSI6Im1lbmUgdMO2aWhpbiJ9.MRG6niUDfScxyj4p1NWh-0AJJlPjknC8wPTN2RM1d7g';

const handler = async function (
  request: LoginRequest,
  reply: FastifyReply
): Promise<void> {
  const result: { id: 'String'; salt: 'String'; password_hash: 'String' } =
    await knexController('user')
      .where('email', request.body.email)
      .first('id', 'salt', 'password_hash');

  if (result === undefined) {
    // This means that user doesn't exist, we are not going to tell that to the client.
    return errorHandler(reply, 401);
  }

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

  await initializeRefreshTokenRotationSession(
    result.id,
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
