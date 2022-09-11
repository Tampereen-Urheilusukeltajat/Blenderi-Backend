// Disable import first to allow dotenv configuration to happen before any imports
/* eslint-disable import/first */
import * as dotenv from 'dotenv';
dotenv.config();

import { log } from './lib/log';
import { initServer } from './server';

// Env variables

module.exports = (async () => {
  try {
    const server = await initServer();
    await server.start();
  } catch (error) {
    log.error('Error starting server!', error);
    process.exit(1);
  }

  log.info('Blenderi backend started succesfully');
})();
