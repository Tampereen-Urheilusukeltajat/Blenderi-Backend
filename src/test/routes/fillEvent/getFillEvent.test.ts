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

describe('get fill events of the user', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('get_fill_event');
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
        email: 'test@email.fi',
        password: 'password',
      },
    });
    const tokens = JSON.parse(res.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
  });

  describe('successful', () => {
    test('Get fill events', async () => {
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'GET',
        headers,
      });

      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(200);
      expect(resBody).toMatchInlineSnapshot(`
        [
          {
            "createdAt": "2023-01-30",
            "cylinderSetId": "f4e1035e-f36e-4056-9a1b-5925a3c5793e",
            "cylinderSetName": "pullosetti_1",
            "description": "täyttö sujui hyvin",
            "gasMixture": "EAN21",
            "id": "2",
            "price": 0,
            "userId": "a58fff36-4f75-11ed-96ae-77941df88822",
          },
        ]
      `);
    });
  });

  describe('unsuccessful', () => {
    test('responds 401 if authentication header was not provided', async () => {
      const res = await server.inject({
        method: 'GET',
        url: 'api/fill-event',
      });

      expect(res.statusCode).toEqual(401);
    });
  });
});
