import { createClient } from 'redis';
import { log } from './log';

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
