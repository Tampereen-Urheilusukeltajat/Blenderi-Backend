import { createClient } from 'redis';
import { log } from '../utils/log';
import { FastifyReply } from 'fastify';
import { AuthTokens } from '../../types/auth.types';
import { v4 as uuid } from 'uuid';

// Expire times in seconds
export const REFRESH_TOKEN_EXPIRE_TIME = 2678400; // ~month
export const ACCESS_TOKEN_EXPIRE_TIME = 600;

export const EXAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhIjpudWxsfQ.d3KrYIOoi5LIdMEbSpeMj7Hrw26hhBk0s9_FUwNTcoE';

const redisClient = createClient();
redisClient.on('error', (error) =>
  log.error('Redis client error event', error)
);

export const initializeRefreshTokenRotationSession = async (
  userId: string,
  refreshTokenId: string,
  refreshToken: string
): Promise<void> => {
  await redisClient.connect();
  await redisClient.set(`${userId}:${refreshTokenId}`, refreshToken, {
    EX: REFRESH_TOKEN_EXPIRE_TIME,
  });
  await redisClient.disconnect();
};

export const tokenIsUsable = async (
  oldToken: string,
  userId: string,
  oldTokenId: string
): Promise<boolean> => {
  await redisClient.connect();
  const oldTokenFromCache: string | null = await redisClient.get(
    `${userId}:${oldTokenId}`
  );
  await redisClient.disconnect();

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
  refreshTokenExpireTime: number
): Promise<void> => {
  await redisClient.connect();

  await redisClient.del(`${userId}:${oldTokenId}`);
  await redisClient.set(`${userId}:${newTokenId}`, refreshToken, {
    EX: refreshTokenExpireTime,
  });

  await redisClient.disconnect();
};

export const invalidate = async (
  tokenId: string,
  userId: string
): Promise<void> => {
  await redisClient.connect();
  await redisClient.del(`${userId}:${tokenId}`);
  await redisClient.disconnect();
};

/**
 * @param {FastifyReply} reply is passed as a whole because jwtSign is proper method
 * that needs `this` from reply.
 */
export const generateTokens = async (
  reply: FastifyReply,
  userId: string,
  isAdmin: boolean,
  isBlender: boolean
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

  const refreshTokenId = uuid();

  const refreshToken = await reply.jwtSign(
    { ...tokenPayload, isRefreshToken: true },
    { expiresIn: REFRESH_TOKEN_EXPIRE_TIME, jti: refreshTokenId }
  );

  return {
    accessToken,
    refreshToken,
    refreshTokenId,
  };
};
