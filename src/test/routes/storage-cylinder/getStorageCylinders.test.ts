import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { createTestDatabase, dropTestDatabase } from '../../../lib/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import { StorageCylinder } from '../../../types/storageCylinder.types';

describe('Create storage cylinder', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('get_storage_cylinder');
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
  });

  let server: FastifyInstance;
  let headers: { Authorization: string };
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
  });

  describe('Happy path', () => {
    test('responds with the storage cylinders and with the 200 status', async () => {
      const res = await server.inject({
        headers,
        method: 'GET',
        url: 'api/storage-cylinder',
      });

      expect(res.statusCode).toEqual(200);
      const body: StorageCylinder = JSON.parse(res.body);

      expect(body).toMatchInlineSnapshot();
    });
  });

  describe('Unhappy path', () => {
    test('responds 401 if authentication header was not provided', async () => {
      const res = await server.inject({
        method: 'GET',
        url: 'api/storage-cylinder',
      });

      expect(res.statusCode).toEqual(401);
    });
  });
});
