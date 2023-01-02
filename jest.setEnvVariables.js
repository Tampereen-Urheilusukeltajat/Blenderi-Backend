/* eslint-disable */
import { randomUUID } from 'crypto';

const TEST_DB = `test-db-${randomUUID()}`;
process.env.TEST_DATABASE = TEST_DB;

console.log('Test database:', TEST_DB);
