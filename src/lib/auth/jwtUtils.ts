import { redisClient } from './redis';
import { log } from '../utils/log';
import { type FastifyReply } from 'fastify';
import { type AuthTokens } from '../../types/auth.types';
import { randomUUID } from 'crypto';

// Expire times in seconds
export const REFRESH_TOKEN_EXPIRE_TIME = 2678400; // ~month
export const ACCESS_TOKEN_EXPIRE_TIME = 600;

export const EXAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhIjpudWxsfQ.d3KrYIOoi5LIdMEbSpeMj7Hrw26hhBk0s9_FUwNTcoE';

export const initializeRefreshTokenRotationSession = async (
  userId: string,
  refreshTokenId: string,
  refreshToken: string,
): Promise<void> => {
  await redisClient.set(`${userId}:${refreshTokenId}`, refreshToken, {
    EX: REFRESH_TOKEN_EXPIRE_TIME,
  });
};

export const tokenIsUsable = async (
  oldToken: string,
  userId: string,
  oldTokenId: string,
): Promise<boolean> => {
  const oldTokenFromCache: string | null = await redisClient.get(
    `${userId}:${oldTokenId}`,
  );

  if (oldTokenFromCache === null) {
    log.warn('Refresh token reuse or unknown refresh token.');
    return false;
  }

  // Check equality to catch possible jwt collision
  return oldTokenFromCache === oldToken;
};

export const rotate = async (
  oldTokenId: string,
  newTokenId: string,
  userId: string,
  refreshToken: string,
  refreshTokenExpireTime: number,
): Promise<void> => {
  await redisClient.del(`${userId}:${oldTokenId}`);
  await redisClient.set(`${userId}:${newTokenId}`, refreshToken, {
    EX: refreshTokenExpireTime,
  });
};

export const invalidate = async (
  tokenId: string,
  userId: string,
): Promise<void> => {
  await redisClient.del(`${userId}:${tokenId}`);
};

/**
 * @param {FastifyReply} reply is passed as a whole because jwtSign is proper method
 * that needs `this` from reply.
 */
export const generateTokens = async (
  reply: FastifyReply,
  userId: string,
  isAdmin: boolean,
  isBlender: boolean,
): Promise<AuthTokens & { refreshTokenId: string }> => {
  const tokenPayload = {
    id: userId,
    isAdmin,
    isBlender,
    isRefreshToken: false,
  };

  const accessToken = await reply.jwtSign(tokenPayload, {
    expiresIn: ACCESS_TOKEN_EXPIRE_TIME,
  });

  const refreshTokenId = randomUUID();

  const refreshToken = await reply.jwtSign(
    { ...tokenPayload, isRefreshToken: true },
    { expiresIn: REFRESH_TOKEN_EXPIRE_TIME, jti: refreshTokenId },
  );

  return {
    accessToken,
    refreshToken,
    refreshTokenId,
  };
};
