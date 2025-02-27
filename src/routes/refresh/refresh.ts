import { type FastifyInstance, type FastifyReply } from 'fastify';
import { errorHandler } from '../../lib/utils/errorHandler';
import { log } from '../../lib/utils/log';
import {
  tokenIsUsable,
  rotate,
  REFRESH_TOKEN_EXPIRE_TIME,
  EXAMPLE_JWT,
  generateTokens,
} from '../../lib/auth/jwtUtils';
import {
  refreshRequestBody,
  type RefreshRequest,
  authResponse,
  type AuthUser,
} from '../../types/auth.types';

const schema = {
  description: 'Rotate refresh token and get a new access token.',
  tags: ['Auth'],
  body: refreshRequestBody,
  response: {
    200: authResponse,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

schema.body.properties.refreshToken.example = EXAMPLE_JWT;
schema.response['200'].properties.accessToken.example = EXAMPLE_JWT;
schema.response['200'].properties.refreshToken.example = EXAMPLE_JWT;

const handler = async function (
  request: RefreshRequest,
  reply: FastifyReply,
): Promise<void> {
  let oldRefreshTokenDecoded: AuthUser;
  try {
    oldRefreshTokenDecoded = this.jwt.verify(
      request.body.refreshToken,
    ) as AuthUser;
  } catch (error) {
    if (error?.code === 'FAST_JWT_INVALID_SIGNATURE') {
      log.info('Received invalid refresh token.');
    }

    // In case of expired refresh token error.code would be
    // FAST_JWT_EXPIRED. This is totally normal and should not be logged.

    return errorHandler(reply, 401);
  }
  const userId: string = oldRefreshTokenDecoded.id;
  const oldRefreshTokenId: string = oldRefreshTokenDecoded.jti;

  const isTokenUsable = await tokenIsUsable(
    request.body.refreshToken,
    userId,
    oldRefreshTokenId,
  );

  if (!isTokenUsable) {
    return errorHandler(reply, 403);
  }

  const { accessToken, refreshToken, refreshTokenId } = await generateTokens(
    reply,
    userId,
    // TODO: What a perfect opportunity to check if these are still valid...
    oldRefreshTokenDecoded.isAdmin,
    oldRefreshTokenDecoded.isBlender,
    oldRefreshTokenDecoded.isUser,
    oldRefreshTokenDecoded.isAdvancedBlender,
    oldRefreshTokenDecoded.isInstructor,
    oldRefreshTokenDecoded.fullName,
  );

  await rotate(
    oldRefreshTokenId,
    refreshTokenId,
    userId,
    refreshToken,
    REFRESH_TOKEN_EXPIRE_TIME,
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
