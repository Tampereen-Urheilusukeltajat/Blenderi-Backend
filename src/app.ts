// Disable import first to allow dotenv configuration to happen before any imports
/* eslint-disable import/first */
import * as dotenv from 'dotenv';
dotenv.config();

import { knexController } from './database/database';
import { connect } from './lib/auth/redis';

import { log } from './lib/utils/log';
import { buildServer } from './server';

const APPLICATION_HOST = process.env.APPLICATION_HOST;
const APPLICATION_PORT = Number(process.env.APPLICATION_PORT);
const ROUTE_PREFIX = process.env.ROUTE_PREFIX;

if (!APPLICATION_HOST || !APPLICATION_PORT || !ROUTE_PREFIX) {
  throw new Error(
    'Missing required env variables: APPLICATION_HOST. APPLICATION_PORT, ROUTE_PREFIX',
  );
}

void (async () => {
  log.info('Running migrations');
  try {
    await knexController.migrate.latest();
  } catch (error) {
    log.error('Error running migrations!', error);
    process.exit(1);
  }

  log.info('Connecting to redis');
  try {
    await connect();
  } catch (error) {
    log.error('Error connecting redis!', error);
    process.exit(1);
  }

  log.info('Starting server');
  try {
    const server = await buildServer({
      routePrefix: ROUTE_PREFIX,
    });
    await server.listen({
      host: APPLICATION_HOST,
      port: APPLICATION_PORT,
    });
  } catch (error) {
    log.error('Error starting server!', error);
    process.exit(1);
  }

  log.info('Blenderi backend started successfully');
})();
