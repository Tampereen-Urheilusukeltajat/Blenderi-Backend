import { createClient } from 'redis';
import { log } from '../utils/log';

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
if (REDIS_HOST === undefined || REDIS_PORT === undefined) {
  throw new Error(
    'REDIS_HOST or REDIS_PORT environment variables not provided.',
  );
}

const REDIS_SETTINGS = {
  url: `${REDIS_HOST}:${REDIS_PORT}`,
};

export const redisClient = createClient(REDIS_SETTINGS);

redisClient.on('error', (error) =>
  log.error('Redis client error event', error),
);

redisClient.on('reconnecting', () => {
  log.warn('Redis client is reconnecting');
});

export const connect = async (): Promise<void> => redisClient.connect();

export const disconnect = async (): Promise<void> => redisClient.quit();
