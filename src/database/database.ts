import config from '../../knexfile';
import knex from 'knex';

export enum Env {
  development = 'development',
  production = 'production',
}

const ENV = (process.env.ENVIRONMENT as Env) ?? Env.development;

export const knexController = knex(config[ENV]);
