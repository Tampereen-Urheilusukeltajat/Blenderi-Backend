/* eslint-disable */
import { randomUUID } from 'crypto';

process.env.TEST_DATABASE = `test-db-${randomUUID()}`;
process.env.JWT_SECRET = 'dontuseme';
