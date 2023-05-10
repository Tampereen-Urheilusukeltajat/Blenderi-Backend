import { createClient } from 'redis';
import { log } from '../utils/log';

export const redisClient = createClient();

redisClient.on('error', (error) =>
  log.error('Redis client error event', error)
);

redisClient.on('reconnecting', () => {
  log.warn('Redis client is reconnecting');
});

export const connect = async (): Promise<void> => redisClient.connect();

export const disconnect = async (): Promise<void> => redisClient.quit();
