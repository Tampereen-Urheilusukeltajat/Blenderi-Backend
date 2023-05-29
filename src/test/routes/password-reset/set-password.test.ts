import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import {
  createTestDatabase,
  dropTestDatabase,
  startRedisConnection,
  stopRedisConnection,
} from '../../../lib/utils/testUtils';

describe('Set new password', () => {
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

  test('It returns 204 for existing user', async () => {
    const res = await server.inject({
      url: '/api/reset-password/set-password',
      method: 'POST',
      payload: {
        token: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        email: 'user@example.com',
        password: 'rockYou.txt',
      },
    });

    expect(res.statusCode).toEqual(204);
  });

  test('It returns 204 for nonexistent user', async () => {
    const res = await server.inject({
      url: '/api/reset-password/set-password',
      method: 'POST',
      payload: {
        token: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        email: 'nonexistent.user@example.com',
        password: 'rockYou.txt',
      },
    });

    expect(res.statusCode).toEqual(204);
  });
});
