import { createClient } from 'redis';
import { log } from './log';

const redisClient = createClient();

redisClient.on('error', (err) => log.error('Redis Client Error', err));

export async function oldRefreshTokenIsValid(
  oldToken: string,
  userId: string,
  oldJti: string
): Promise<boolean> {
  await redisClient.connect();
  const oldTokenFromCache: string | null = await redisClient.get(
    userId + ':' + oldJti
  );
  await redisClient.disconnect();

  return oldTokenFromCache === oldToken;
}

export async function rotate(
  oldJti: string,
  jti: string,
  userId: string,
  refreshToken: string,
  refreshTokenExpireTime: number
): Promise<void> {
  await redisClient.connect();
  await redisClient.del(userId + ':' + oldJti);

  await redisClient.set(userId + ':' + jti, refreshToken, {
    EX: refreshTokenExpireTime,
  });
  await redisClient.disconnect();
}
