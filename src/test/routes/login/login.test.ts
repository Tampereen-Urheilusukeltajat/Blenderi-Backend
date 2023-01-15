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
import { createTestDatabase, dropTestDatabase } from '../../../lib/testUtils';

describe('Login', () => {
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

  let server;
  beforeEach(async () => {
    server = await getTestInstance();
  });

  describe('Happy path', () => {
    test('It returns 200 on successful login', async () => {
      const res = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'user@example.com',
          password: 'password',
        },
      });
      expect(res.statusCode).toEqual(200);
      const resBody = JSON.parse(res.body);
      expect(resBody).toHaveProperty('accessToken');
      expect(resBody).toHaveProperty('refreshToken');
    });

    test('It returns correct roles inside the JWT token', async () => {
      const res = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'user@example.com',
          password: 'password',
        },
      });
      expect(res.statusCode).toEqual(200);
      const resBody = JSON.parse(res.body);
      const tokenPayload = JSON.parse(
        Buffer.from(resBody.accessToken.split('.')[1], 'base64').toString()
      );

      expect(tokenPayload).toHaveProperty('iat');
      delete tokenPayload.iat;

      expect(tokenPayload).toHaveProperty('exp');
      delete tokenPayload.exp;

      expect(tokenPayload).toMatchInlineSnapshot(`
        {
          "id": "1be5abcd-53d4-11ed-9342-0242ac120002",
          "isAdmin": false,
          "isBlender": true,
        }
      `);
    });
  });
  describe('Unhappy path', () => {
    test('It returns 401 if user is not found', async () => {
      const res = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'non-existent-user@example.com',
          password: 'password',
        },
      });
      expect(res.statusCode).toEqual(401);
      const resBody = JSON.parse(res.body);
      expect(resBody).not.toHaveProperty('accessToken');
      expect(resBody).not.toHaveProperty('refreshToken');
    });

    test('It returns 401 if password is wrong', async () => {
      const res = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'user@example.com',
          password: 'wrong-password',
        },
      });
      expect(res.statusCode).toEqual(401);
      const resBody = JSON.parse(res.body);
      expect(resBody).not.toHaveProperty('accessToken');
      expect(resBody).not.toHaveProperty('refreshToken');
    });

    test('It returns 400 for invalid body', async () => {
      const res = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: null,
          password: null,
        },
      });
      expect(res.statusCode).toEqual(400);
      const resBody = JSON.parse(res.body);
      expect(resBody).not.toHaveProperty('accessToken');
      expect(resBody).not.toHaveProperty('refreshToken');
    });

    test('Archived user cannot login', async () => {
      const res = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'oujea@XD.fi',
          password: 'password',
        },
      });
      expect(res.statusCode).toEqual(401);
      const resBody = JSON.parse(res.body);
      expect(resBody).not.toHaveProperty('accessToken');
      expect(resBody).not.toHaveProperty('refreshToken');
    });
  });
});
