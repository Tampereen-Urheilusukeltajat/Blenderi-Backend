import { createClient } from 'redis';
import { log } from '../utils/log';

const REDIS_SETTINGS = {
  url: `${process.env.REDIS_HOST ?? 'redis://127.0.0.1'}:${
    process.env.REDIS_PORT ?? '6379'
  }`,
};

export const redisClient = createClient(REDIS_SETTINGS);

redisClient.on('error', (error) =>
  log.error('Redis client error event', error)
);

redisClient.on('reconnecting', () => {
  log.warn('Redis client is reconnecting');
});

export const connect = async (): Promise<void> => redisClient.connect();

export const disconnect = async (): Promise<void> => redisClient.quit();
