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

describe('Get enriched gases', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('get_enriched_gas');
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
    test('responds with enriched gases and 200 status', async () => {
      const res = await server.inject({
        headers,
        method: 'GET',
        url: 'api/gas',
      });

      expect(res.statusCode).toEqual(200);
      const body = JSON.parse(res.body);

      expect(body.length).toEqual(5);
      expect(body[0]).toHaveProperty('activeFrom');

      delete body[0].activeFrom;

      expect(body[0]).toMatchInlineSnapshot(`
        {
          "activeTo": "9999-12-31T23:59:59.000Z",
          "gasId": "1",
          "gasName": "Air",
          "gasPriceId": "1",
          "priceEurCents": 0,
        }
      `);
    });
  });

  describe('Unhappy path', () => {
    test('responds 401 if authentication header was not provided', async () => {
      const res = await server.inject({
        method: 'GET',
        url: 'api/gas',
      });

      expect(res.statusCode).toEqual(401);
    });
  });
});
