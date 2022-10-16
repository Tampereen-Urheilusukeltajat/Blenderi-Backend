import { knex } from 'knex';
import {
  DB_CONNECTION,
  TEST_DATABASE,
  TEST_USER,
  TEST_USER_PASSWORD,
} from '../../knexfile';
import { readdir, readFile } from 'fs/promises';
import { knexController } from '../database/database';

const MYSQL_ROOT_PASSWORD = process.env.MYSQL_ROOT_PASSWORD;

const runMigrations = async (): Promise<void> => {
  await knexController.migrate.latest();
};

const readTestDataFolderToDatabase = async (
  testDataFolderName: string
): Promise<void> => {
  const files = await readdir(`./src/test_data/${testDataFolderName}`);

  for (const file of files) {
    const content = (
      await readFile(`./src/test_data/${testDataFolderName}/${file}`, 'utf8')
    ).split('\n');
    const columns = content[0].split(';');

    // Remove columns from the data
    content.shift();

    const insertPayloads = content
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

    const tableName = file.slice(undefined, -4);
    await knexController(tableName).insert(insertPayloads);
  }
};

export const createTestDatabase = async (
  testDataFolder: string
): Promise<void> => {
  const adminKnex = knex({
    client: 'mysql',
    connection: {
      ...DB_CONNECTION,
      user: 'root',
      password: MYSQL_ROOT_PASSWORD,
    },
  });
  await adminKnex.raw(`CREATE DATABASE IF NOT EXISTS :testDatabase;`, {
    testDatabase: TEST_DATABASE,
  });
  await adminKnex.raw(
    `GRANT ALL PRIVILEGES ON :testDatabase.* TO ':testUser'@'%' IDENTIFIED BY ':testUserPassword'`,
    {
      testDatabase: TEST_DATABASE,
      testUser: TEST_USER,
      testUserPassword: TEST_USER_PASSWORD,
    }
  );
  await adminKnex.destroy();

  await runMigrations();

  await readTestDataFolderToDatabase(testDataFolder);
};

export const dropTestDabase = async (): Promise<void> => {
  const adminKnex = knex({
    client: 'mysql',
    connection: {
      ...DB_CONNECTION,
      user: 'root',
      password: MYSQL_ROOT_PASSWORD,
    },
  });
  await adminKnex.raw(`DROP DATABASE IF EXISTS :testDatabase`, {
    testDatabase: TEST_DATABASE,
  });
  await adminKnex.destroy();
};
