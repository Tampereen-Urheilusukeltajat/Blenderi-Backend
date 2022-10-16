import config from '../../knexfile';
import knex from 'knex';

export enum Env {
  development = 'development',
  production = 'production',
  test = 'test',
}

const ENV = (process.env.NODE_ENV as Env) ?? Env.development;

export const knexController = knex(config[ENV]);
