import config from '../../knexfile';
import knex from 'knex';
import { log } from '../lib/log';

export enum Env {
  development = 'development',
  production = 'production',
  test = 'test',
}

const ENV = (process.env.NODE_ENV as Env) ?? Env.development;

log.info(config[ENV]);

export const knexController = knex(config[ENV]);
