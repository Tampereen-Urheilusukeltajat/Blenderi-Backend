import {
  jest,
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
} from '../../../lib/utils/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import { StorageCylinder } from '../../../types/storageCylinder.types';

describe('Get enriched gases', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('get_enriched_gas');
    Date.now = jest.fn(() => +new Date('2022-01-05'));
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
    test('responds with enriched gases and 200 status', async () => {
      const res = await server.inject({
        headers,
        method: 'GET',
        url: 'api/gas',
      });

      expect(res.statusCode).toEqual(200);
      const body: StorageCylinder = JSON.parse(res.body);

      expect(body).toMatchInlineSnapshot(`
        [
          {
            "activeFrom": "2020-01-01T00:00:00.000Z",
            "activeTo": "9999-12-31T23:59:59.000Z",
            "gasId": 2,
            "gasName": "Helium",
            "gasPriceId": 1,
            "priceEurCents": 5,
          },
          {
            "activeFrom": "2022-01-01T00:00:00.000Z",
            "activeTo": "2023-01-01T00:00:00.000Z",
            "gasId": 3,
            "gasName": "Oxygen",
            "gasPriceId": 3,
            "priceEurCents": 5,
          },
          {
            "activeFrom": null,
            "activeTo": null,
            "gasId": 1,
            "gasName": "Air",
            "gasPriceId": null,
            "priceEurCents": null,
          },
          {
            "activeFrom": null,
            "activeTo": null,
            "gasId": 4,
            "gasName": "Argon",
            "gasPriceId": null,
            "priceEurCents": null,
          },
          {
            "activeFrom": null,
            "activeTo": null,
            "gasId": 5,
            "gasName": "Diluent",
            "gasPriceId": null,
            "priceEurCents": null,
          },
        ]
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
