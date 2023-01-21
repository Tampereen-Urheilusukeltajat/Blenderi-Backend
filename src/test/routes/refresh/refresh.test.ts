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
} from '../../../lib/utils/testUtils';

describe('Refresh', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('auth');
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
  });

  let refreshToken: string;
  let server;
  beforeEach(async () => {
    server = await getTestInstance();
    const res = await server.inject({
      url: '/api/login',
      method: 'POST',
      payload: {
        email: 'user@example.com',
        password: 'password',
      },
    });
    expect(res.statusCode).toEqual(200);
    const tokens = JSON.parse(res.body);
    refreshToken = String(tokens.refreshToken);
  });

  describe('Happy path', () => {
    test('It returns 200 on successful refresh token rotate', async () => {
      const res = await server.inject({
        url: '/api/refresh',
        method: 'POST',
        payload: {
          refreshToken,
        },
      });
      expect(res.statusCode).toEqual(200);
      const resBody = JSON.parse(res.body);
      expect(resBody).toHaveProperty('accessToken');
      expect(resBody).toHaveProperty('refreshToken');
      expect(resBody.refreshToken).not.toEqual(refreshToken);
    });
  });
  describe('Unhappy path', () => {
    test('It returns 401 for invalid refreshToken (tampered)', async () => {
      const res = await server.inject({
        url: '/api/refresh',
        method: 'POST',
        payload: {
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhIjpudWxsfQ.d3KrYIOoi5LIdMEbSpeMj7Hrw26hhBk0s9_FUwNTcoE',
        },
      });

      expect(res.statusCode).toEqual(401);
      const resBody = JSON.parse(res.body);
      expect(resBody).not.toHaveProperty('accessToken');
      expect(resBody).not.toHaveProperty('refreshToken');
    });

    test('It returns 400 for invalid body', async () => {
      const res = await server.inject({
        url: '/api/refresh',
        method: 'POST',
        payload: {},
      });
      expect(res.statusCode).toEqual(400);
      const resBody = JSON.parse(res.body);
      expect(resBody).not.toHaveProperty('accessToken');
      expect(resBody).not.toHaveProperty('refreshToken');
    });

    test('It returns 401 if refreshToken is used as accesstoken', async () => {
      const res = await server.inject({
        url: '/api/user/1be5abcd-53d4-11ed-9342-0242ac120002',
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + String(refreshToken),
        },
      });
      expect(res.statusCode).toEqual(401);
      const resBody = JSON.parse(res.body);
      expect(resBody).not.toHaveProperty('id');
      expect(resBody).not.toHaveProperty('email');
    });
  });
});
