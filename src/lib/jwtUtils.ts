import { createClient } from 'redis';
import { log } from './log';

export const refreshTokenExpireTime = 8640000; // 100 days
export const accessTokenExpireTime = 100;

const redisClient = createClient();

// TODO: ??? paranna
redisClient.on('error', (err) => log.error('Redis Client Error', err));

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
