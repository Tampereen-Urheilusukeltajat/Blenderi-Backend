import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { FastifyInstance } from 'fastify';
import {
  createTestDatabase,
  dropTestDatabase,
  startRedisConnection,
  stopRedisConnection,
} from '../../../lib/utils/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import { Compressor } from '../../../types/compressor.types';

describe('Get compressors', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('get_compressors');
    await startRedisConnection();
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
    await stopRedisConnection();
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
    test('responds with the compressors and with the 200 status', async () => {
      const res = await server.inject({
        headers,
        method: 'GET',
        url: 'api/compressor',
      });

      expect(res.statusCode).toEqual(200);
      const body: Compressor = JSON.parse(res.body);

      expect(body).toMatchInlineSnapshot(`
        [
          {
            "description": "se punainen Maijalassa",
            "id": "1be5abcd-53d4-11ed-9342-0242ac120002",
            "isEnabled": true,
            "name": "iso kompura",
          },
          {
            "description": "siä takana",
            "id": "54e3e8b0-53d4-11ed-9342-0242ac120002",
            "isEnabled": false,
            "name": "varakompura",
          },
        ]
      `);
    });
  });

  describe('Unhappy path', () => {
    test('responds 401 if authentication header was not provided', async () => {
      const res = await server.inject({
        method: 'GET',
        url: 'api/compressor',
      });

      expect(res.statusCode).toEqual(401);
    });
  });
});
