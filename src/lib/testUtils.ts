// Disable import first to allow dotenv configuration to happen before any imports
/* eslint-disable import/first */
import * as dotenv from 'dotenv';
dotenv.config();

import { knex } from 'knex';
import {
  DB_CONNECTION,
  TEST_DATABASE,
  TEST_USER,
  TEST_USER_PASSWORD,
} from '../../knexfile';
import { readdir, readFile } from 'fs/promises';
import { knexController } from '../database/database';
import { log } from './log';

const MYSQL_ROOT_PASSWORD = process.env.MYSQL_ROOT_PASSWORD;

/**
 * We can't read tables to the database in random order, since they might have foreign keys that are depended on each other.
 * This array provides an order in which the tables are read to the database.
 */
const TABLE_READ_ORDER = [
  'initial_blender_access_list',
  'user',
  'diving_cylinder',
  'diving_cylinder_set',
  'diving_cylinder_to_set',
];

const deriveReadOrder = (tableNames: string[]): string[] => {
  const unknownTableNames = tableNames.filter(
    (tableName) => !TABLE_READ_ORDER.includes(tableName)
  );
  if (unknownTableNames.length > 0) {
    throw new Error(
      'Unknown table names met! Plaese add them to TABLE_READ_ORDER!'
    );
  }

  const tableNamesSet = new Set(tableNames);
  return TABLE_READ_ORDER.filter((tableName) => tableNamesSet.has(tableName));
};

/**
 * Reads test data folder contents to the test database.
 * @param testDataFolderName
 * @returns Promise<void>
 */
const readTestDataFolderToDatabase = async (
  testDataFolderName: string
): Promise<void> => {
  const tableNames = (
    await readdir(`./src/test_data/${testDataFolderName}`)
  ).map((file) => file.slice(undefined, -4));

  // Ignore empty folders
  if (tableNames.length === 0) return;

  const tableNamesInOrder = deriveReadOrder(tableNames);

  for (const tableName of tableNamesInOrder) {
    const content = (
      await readFile(
        `./src/test_data/${testDataFolderName}/${tableName}.csv`,
        'utf8'
      )
    ).split('\n');

    // Ignore empty or files without columns.
    // There will always be at least one entry to the array
    if (content.length < 2 || content[0] === '') return;

    const columns = content[0].split(';');

    // Remove columns from the data
    content.shift();

    const insertPayloads = content
      // Filter empty lines (e.g. in the end of file)
      .filter((row) => row !== '')
      .map((row) => {
        const values = row.split(';');
        const keyValuePairs = new Map();
        for (let i = 0; i < columns.length; i++) {
          if (columns[i] !== '' && values[i] !== '')
            keyValuePairs.set(columns[i], values[i]);
        }

        return Object.fromEntries(keyValuePairs);
      });

    await knexController(tableName).insert(insertPayloads);
  }
};

const runMigrations = async (): Promise<void> => {
  await knexController.migrate.latest();
};

/**
 * Creates test database and runs migrations
 * @param testDataFolder If provided, reads the .csv files from the folder
 * and inserts values to the database
 */
export const createTestDatabase = async (
  testDataFolder?: string
): Promise<void> => {
  const adminKnex = knex({
    client: 'mysql',
    connection: {
      ...DB_CONNECTION,
      user: 'root',
      password: MYSQL_ROOT_PASSWORD,
    },
  });

  log.info({
    testDatabase: TEST_DATABASE,
    testUser: TEST_USER,
    testUserPassword: TEST_USER_PASSWORD,
  });

  await adminKnex.raw(`CREATE DATABASE IF NOT EXISTS :testDatabase:;`, {
    testDatabase: TEST_DATABASE,
  });
  await adminKnex.raw(
    `GRANT ALL PRIVILEGES ON :testDatabase:.* TO ':testUser:'@'*' IDENTIFIED BY ':testUserPassword:'`,
    {
      testDatabase: TEST_DATABASE,
      testUser: TEST_USER,
      testUserPassword: TEST_USER_PASSWORD,
    }
  );
  await adminKnex.destroy();

  await runMigrations();

  if (testDataFolder !== undefined) {
    await readTestDataFolderToDatabase(testDataFolder);
  }
};

/**
 * Drops the test database. Should be ran in the afterAll -clause.
 */
export const dropTestDabase = async (): Promise<void> => {
  const adminKnex = knex({
    client: 'mysql',
    connection: {
      ...DB_CONNECTION,
      user: 'root',
      password: MYSQL_ROOT_PASSWORD,
    },
  });
  await adminKnex.raw(`DROP DATABASE IF EXISTS :testDatabase:;`, {
    testDatabase: TEST_DATABASE,
  });
  await adminKnex.destroy();
};
