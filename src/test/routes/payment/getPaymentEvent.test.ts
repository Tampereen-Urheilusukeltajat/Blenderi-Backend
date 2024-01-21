import {
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
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

describe('create fill event', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('get_payment_event');
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

  test('Gets all payment events for user', async () => {
    const res = await server.inject({
      url: 'api/payment',
      method: 'GET',
      headers,
    });

    const resBody = JSON.parse(res.body);
    expect(res.statusCode).toEqual(200);
    expect(resBody[0].updatedAt).toBeDefined();
    expect(resBody[0].createdAt).toBeDefined();
    delete resBody[0].updatedAt;
    delete resBody[0].createdAt;
    expect(resBody).toMatchInlineSnapshot(`
      [
        {
          "id": "100fa428-03ae-4350-8529-3377f5087244",
          "status": "IN_PROGRESS",
          "userId": "a58fff36-4f75-11ed-96ae-77941df88822",
        },
      ]
    `);
  });

  test('Gets payment event by id', async () => {
    const res = await server.inject({
      url: 'api/payment/100fa428-03ae-4350-8529-3377f5087244',
      method: 'GET',
      headers,
    });

    const resBody = JSON.parse(res.body);
    expect(res.statusCode).toEqual(200);
    expect(resBody.updatedAt).toBeDefined();
    expect(resBody.createdAt).toBeDefined();
    delete resBody.updatedAt;
    delete resBody.createdAt;
    expect(resBody).toMatchInlineSnapshot(`
      {
        "id": "100fa428-03ae-4350-8529-3377f5087244",
        "status": "IN_PROGRESS",
        "userId": "a58fff36-4f75-11ed-96ae-77941df88822",
      }
    `);
  });

  test('Is not able to get payment event for another user', async () => {
    const loginRes = await server.inject({
      url: '/api/login',
      method: 'POST',
      payload: {
        email: 'test2@email.fi',
        password: 'password',
      },
    });
    const tokens = JSON.parse(loginRes.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };

    const res = await server.inject({
      url: 'api/payment/100fa428-03ae-4350-8529-3377f5087244',
      method: 'GET',
      headers,
    });

    const resBody = JSON.parse(res.body);
    expect(res.statusCode).toEqual(404);
    expect(resBody).toMatchInlineSnapshot(`
      {
        "error": "Not Found",
        "statusCode": 404,
      }
    `);
  });
});
