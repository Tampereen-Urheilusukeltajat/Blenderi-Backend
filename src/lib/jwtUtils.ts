import { createClient } from 'redis';
import { log } from './log';

export const REFRESH_TOKEN_EXPIRE_TIME = 8640000; // 100 days
export const ACCESS_TOKEN_EXPIRE_TIME = 100;

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
  await redisClient.set(userId + ':' + refreshTokenId, refreshToken, {
    EX: REFRESH_TOKEN_EXPIRE_TIME,
  });
  await redisClient.disconnect();
};

export const tokenIsUsable = async (
  oldToken: string,
  userId: string,
  oldJti: string
): Promise<boolean> => {
  await redisClient.connect();
  const oldTokenFromCache: string | null = await redisClient.get(
    userId + ':' + oldJti
  );
  await redisClient.disconnect();

  if (oldTokenFromCache === null) {
    log.warn('Refresh token reuse or unknown refresh token.');
    return false;
  }

  return oldTokenFromCache === oldToken;
};

export const rotate = async (
  oldJti: string,
  jti: string,
  userId: string,
  refreshToken: string,
  refreshTokenExpireTime: number
): Promise<void> => {
  await redisClient.connect();

  await redisClient.del(userId + ':' + oldJti);
  await redisClient.set(userId + ':' + jti, refreshToken, {
    EX: refreshTokenExpireTime,
  });

  await redisClient.disconnect();
};
