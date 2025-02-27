/* eslint-disable @typescript-eslint/no-unsafe-argument */
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

describe('Get users', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('get_users');
    await startRedisConnection();
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
    await stopRedisConnection();
  });

  let server;
  let headers: object;
  beforeEach(async () => {
    server = await getTestInstance();
    const res = await server.inject({
      url: '/api/login',
      method: 'POST',
      payload: {
        email: 'test-admin@email.fi',
        password: 'password',
      },
    });
    const tokens = JSON.parse(res.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
  });

  test('it returns all not archived or deleted users', async () => {
    const res = await server.inject({
      url: '/api/user/',
      method: 'GET',
      headers,
    });
    const users = await knexController('user')
      .where({ archived_at: null, deleted_at: null })
      .select('id');
    const resBody = JSON.parse(res.body);
    expect(res.statusCode).toEqual(200);
    expect(resBody).toHaveLength(users.length);
  });

  test('it returns all users', async () => {
    const res = await server.inject({
      url: '/api/user?includeArchived=true',
      method: 'GET',
      headers,
    });
    const users = await knexController('user')
      .whereNull('deleted_at')
      .select('id');
    const resBody = JSON.parse(res.body);
    expect(res.statusCode).toEqual(200);
    expect(resBody).toHaveLength(users.length);
  });

  test('it only returns users to admins', async () => {
    // Simulate a non-admin user login
    const nonAdminRes = await server.inject({
      url: '/api/login',
      method: 'POST',
      payload: {
        email: 'test-user@email.fi',
        password: 'password',
      },
    });
    const nonAdminTokens = JSON.parse(nonAdminRes.body);
    const nonAdminHeaders = {
      Authorization: 'Bearer ' + String(nonAdminTokens.accessToken),
    };

    // Attempt to get users with non-admin credentials
    const res = await server.inject({
      url: '/api/user/',
      method: 'GET',
      headers: nonAdminHeaders,
    });

    // Expect a forbidden status code
    expect(res.statusCode).toEqual(403);
  });
});
