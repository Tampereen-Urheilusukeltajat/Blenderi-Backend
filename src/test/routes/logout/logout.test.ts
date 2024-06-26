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

describe('logout', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('logout');
    await startRedisConnection();
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
    await stopRedisConnection();
  });

  let server;
  let headers: object;
  let refreshToken;
  beforeEach(async () => {
    server = await getTestInstance();
    const res = await server.inject({
      url: '/api/login',
      method: 'POST',
      payload: {
        email: 'test@email.fi',
        password: 'password',
      },
    });
    const tokens = JSON.parse(res.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
    refreshToken = tokens.refreshToken;
  });
  describe('successful logout', () => {
    test('it returns 200 and has right properties', async () => {
      const res = await server.inject({
        url: '/api/logout/',
        method: 'POST',
        headers,
        payload: {
          refreshToken,
        },
      });
      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(200);
      expect(resBody.message).toEqual('Refresh token invalidated.');
      expect(resBody.id).toEqual('1be5abcd-53d4-11ed-9342-0242ac120002');
    });
  });

  test('it returns 401 if refresh token is invalid', async () => {
    const res = await server.inject({
      url: '/api/logout/',
      method: 'POST',
      headers,
      payload: {
        refreshToken: 'invalid.invalid.invalid',
      },
    });
    const resBody = JSON.parse(res.body);
    expect(res.statusCode).toEqual(401);
    expect(resBody.message).not.toEqual('Refresh token invalidated.');
    expect(resBody.id).not.toEqual('1be5abcd-53d4-11ed-9342-0242ac120002');
  });
});
