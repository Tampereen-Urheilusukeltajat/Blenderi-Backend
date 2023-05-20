import { FastifyInstance, FastifyReply } from 'fastify';
import { knexController } from '../../database/database';
import { passwordIsValid } from '../../lib/auth/auth';
import { errorHandler } from '../../lib/utils/errorHandler';
import {
  EXAMPLE_JWT,
  generateTokens,
  initializeRefreshTokenRotationSession,
} from '../../lib/auth/jwtUtils';
import {
  loginRequestBody,
  LoginRequest,
  authResponse,
} from '../../types/auth.types';
import { updateLastLogin } from '../../lib/queries/user';

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

type UserInfo = {
  id: string;
  isAdmin: boolean;
  isBlender: boolean;
  salt: string;
  passwordHash: string;
  archivedAt: string | null;
};

const handler = async (
  request: LoginRequest,
  reply: FastifyReply
): Promise<void> => {
  const userInfo: UserInfo = await knexController('user')
    .where('email', request.body.email)
    .first(
      'id',
      'password_hash AS passwordHash',
      'archived_at as archivedAt',
      'is_admin AS isAdmin',
      'is_blender AS isBlender'
    );

  if (userInfo === undefined) {
    // This means that user doesn't exist, we are not going to tell that to the client.
    return errorHandler(reply, 401);
  }

  if (userInfo.archivedAt !== null) {
    // User is archived, don't allow login
    return errorHandler(reply, 401);
  }

  const isValidPassword = await passwordIsValid(
    request.body.password,
    userInfo.passwordHash
  );

  if (!isValidPassword) {
    return errorHandler(reply, 401);
  }

  // !! converts database bit to boolean value
  const { accessToken, refreshToken, refreshTokenId } = await generateTokens(
    reply,
    userInfo.id,
    !!userInfo.isAdmin,
    !!userInfo.isBlender
  );

  await initializeRefreshTokenRotationSession(
    userInfo.id,
    refreshTokenId,
    refreshToken
  );

  await updateLastLogin(userInfo.id);

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
