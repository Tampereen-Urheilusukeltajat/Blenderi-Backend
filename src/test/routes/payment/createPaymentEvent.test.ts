import {
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
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
    await createTestDatabase('create_payment_event');
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
    afterEach(async () => {
      await knexController('fill_event_payment_event').del();
      await knexController('stripe_dispute').del();
      await knexController('stripe_payment_intent').del();
      await knexController('payment_event').del();
    });

    test('Creates payment event for user', async () => {
      const res = await server.inject({
        url: 'api/payment',
        method: 'POST',
        body: {},
        headers,
      });

      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(201);
      expect(resBody.paymentEventId).toBeDefined();
    });
  });

  describe('unsuccessful', () => {
    test('it returns 400 if user does not have any fill events that should be paid', async () => {
      // User only has air fills
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
        url: 'api/payment',
        method: 'POST',
        body: {},
        headers,
      });

      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(400);
      expect(resBody).toMatchInlineSnapshot(`
        {
          "error": "Bad Request",
          "message": "Nothing due",
          "statusCode": 400,
        }
      `);
    });
  });
});
