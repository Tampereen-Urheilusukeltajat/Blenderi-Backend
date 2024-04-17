import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { type FastifyInstance } from 'fastify';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import {
  createTestDatabase,
  dropTestDatabase,
  startRedisConnection,
  stopRedisConnection,
} from '../../../lib/utils/testUtils';

describe('Password reset request', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('password_reset');
    await startRedisConnection();
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
    await stopRedisConnection();
  });

  let server;
  beforeEach(async () => {
    server = await getTestInstance();
  });

  test('It returns 202 for existing user', async () => {
    const res = await server.inject({
      url: '/api/reset-password/reset-request',
      method: 'POST',
      payload: {
        email: 'user@example.com',
      },
    });

    expect(res.statusCode).toEqual(202);
  });

  test('It returns 202 for nonexistent user', async () => {
    const res = await server.inject({
      url: '/api/reset-password/reset-request',
      method: 'POST',
      payload: {
        email: 'nonexistent.user@example.com',
      },
    });

    expect(res.statusCode).toEqual(202);
  });
});
