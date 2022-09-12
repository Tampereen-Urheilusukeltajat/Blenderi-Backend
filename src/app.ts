// Disable import first to allow dotenv configuration to happen before any imports
/* eslint-disable import/first */
import * as dotenv from 'dotenv';
dotenv.config();

import { log } from './lib/log';
import { buildServer } from './server';

const APPLICATION_HOST: string = process.env.APPLICATION_HOST as string;
const APPLICATION_PORT = Number(process.env.APPLICATION_PORT);
const ROUTE_PREFIX: string = process.env.ROUTE_PREFIX as string;

module.exports = (async () => {
  try {
    const server = await buildServer({
      routePrefix: ROUTE_PREFIX
    });
    await server.listen({
      host: APPLICATION_HOST,
      port: APPLICATION_PORT
    });
  } catch (error) {
    log.error('Error starting server!', error);
    process.exit(1);
  }

  log.info('Blenderi backend started succesfully');
})();
