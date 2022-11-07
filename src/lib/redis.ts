import { createClient } from 'redis';
import { log } from './log';

const client = createClient();

client.on('error', (err) => log.error('Redis Client Error', err));
export default client;
