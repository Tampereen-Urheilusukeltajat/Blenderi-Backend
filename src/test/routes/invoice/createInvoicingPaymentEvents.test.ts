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

describe('Create invoicing payment events', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('create_invoicing_payment_events');
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
      const invoiceRes = await server.inject({
        headers,
        method: 'GET',
        url: 'api/invoicing',
      });
      expect(invoiceRes.statusCode).toEqual(200);

      const paymentEventsRes = await server.inject({
        headers,
        method: 'POST',
        url: 'api/invoicing/payment-events',
        payload: JSON.parse(invoiceRes.body),
      });

      expect(paymentEventsRes.statusCode).toEqual(201);

      const body = JSON.parse(paymentEventsRes.body);

      expect(
        body.map((pe) => {
          expect(pe.id).toBeDefined();
          expect(pe.createdAt).toBeDefined();
          expect(pe.updatedAt).toBeDefined();

          return {
            status: pe.status,
            totalAmountEurCents: pe.totalAmountEurCents,
            userId: pe.userId,
          };
        }),
      ).toMatchInlineSnapshot(`
        [
          {
            "status": "COMPLETED",
            "totalAmountEurCents": 695000,
            "userId": "1be5abcd-53d4-11ed-9342-0242ac120002",
          },
          {
            "status": "COMPLETED",
            "totalAmountEurCents": 500000,
            "userId": "54e3e8b0-53d4-11ed-9342-0242ac120002",
          },
        ]
      `);
    });
  });

  describe('Unhappy path', () => {
    test('responds 401 if authentication header was not provided', async () => {
      const res = await server.inject({
        method: 'POST',
        url: 'api/invoicing/payment-events',
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
        method: 'POST',
        url: 'api/invoicing/payment-events',
      });

      expect(res.statusCode).toEqual(403);
    });
  });
});
