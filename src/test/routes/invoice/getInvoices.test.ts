import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { type FastifyInstance } from 'fastify';
import {
  createTestDatabase,
  dropTestDatabase,
  startRedisConnection,
  stopRedisConnection,
} from '../../../lib/utils/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';

describe('Get compressors', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('get_invoices');
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
        email: 'admin@test.com',
        password: 'password',
      },
    });
    const tokens = JSON.parse(res.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
  });

  describe('Happy path', () => {
    test('responds with the invoices and with the 200 status', async () => {
      const res = await server.inject({
        headers,
        method: 'GET',
        url: 'api/invoicing',
      });

      expect(res.statusCode).toEqual(200);
      const body = JSON.parse(res.body);

      expect(body).toMatchInlineSnapshot(`
        [
          {
            "invoiceRows": [
              {
                "date": "2023-01-30T13:15:28.000Z",
                "description": "",
                "gasMixture": "Trimix 32/10",
                "id": 3,
              },
              {
                "date": "2023-01-30T13:15:28.000Z",
                "description": "",
                "gasMixture": "Trimix 12/10",
                "id": 4,
              },
            ],
            "invoiceTotal": 695000,
            "user": {
              "email": "admin@test.com",
              "forename": "Tester",
              "id": "1be5abcd-53d4-11ed-9342-0242ac120002",
              "surname": "Blender",
            },
          },
          {
            "invoiceRows": [
              {
                "date": "2023-01-30T13:15:28.000Z",
                "description": "",
                "gasMixture": "Trimix 12/10",
                "id": 5,
              },
            ],
            "invoiceTotal": 500000,
            "user": {
              "email": "user@test.com",
              "forename": "testijäbä",
              "id": "54e3e8b0-53d4-11ed-9342-0242ac120002",
              "surname": "asd",
            },
          },
        ]
      `);
    });
  });

  describe('Unhappy path', () => {
    test('responds 401 if authentication header was not provided', async () => {
      const res = await server.inject({
        method: 'GET',
        url: 'api/invoicing',
      });

      expect(res.statusCode).toEqual(401);
    });

    test('Responds with 403 if the user is not an admin', async () => {
      const loginRes = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'user@test.com',
          password: 'password',
        },
      });
      const tokens = JSON.parse(loginRes.body);
      headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };

      const res = await server.inject({
        headers,
        method: 'GET',
        url: 'api/invoicing',
      });

      expect(res.statusCode).toEqual(403);
    });
  });
});
