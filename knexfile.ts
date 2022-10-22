import 'dotenv/config';
import path from 'path';
import { log } from './src/lib/log';

export const TEST_DATABASE = 'test_db';
const DB = process.env.MYSQL_DATABASE ?? 'db';
if (DB === TEST_DATABASE)
  throw new Error(
    `TEST_DATABASE and MYSQL_DATABASE can not have the same value!`
  );

// MySQL client library is used to connect MariaDB
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_PORT = Number(process.env.MYSQL_PORT);

export const TEST_USER = process.env.TEST_USER ?? 'test_user';
export const TEST_USER_PASSWORD =
  process.env.TEST_USER_PASSWORD ?? 'test_user_password';

export const DB_CONNECTION = {
  database: DB,
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  charset: 'utf8mb4',
  port: MYSQL_PORT,
  timezone: 'Z',
};

export default {
  development: {
    client: 'mysql',
    connection: DB_CONNECTION,
    migrations: {
      directory: path.join(__dirname, '/src/database/migrations'),
    },
    log: {
      warn(msg: string) {
        log.warn(msg);
      },
      error(msg: string) {
        log.error(msg);
      },
      deprecate(msg: string) {
        log.info(msg);
      },
      debug(msg: string) {
        log.debug(msg);
      },
    },
    debug: true,
  },

  production: {
    client: 'mysql',
    connection: DB_CONNECTION,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
    log: {
      warn(msg: string) {
        log.warn(msg);
      },
      error(msg: string) {
        log.error(msg);
      },
      deprecate(msg: string) {
        log.info(msg);
      },
      debug(msg: string) {
        log.debug(msg);
      },
    },
  },

  test: {
    client: 'mysql',
    connection: {
      ...DB_CONNECTION,
      database: TEST_DATABASE,
      password: TEST_USER_PASSWORD,
      user: TEST_USER,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './src/database/migrations',
    },
    log: {
      warn(msg: string) {
        log.warn(msg);
      },
      error(msg: string) {
        log.error(msg);
      },
      deprecate(msg: string) {
        log.info(msg);
      },
      debug(msg: string) {
        log.debug(msg);
      },
    },
  },
};
