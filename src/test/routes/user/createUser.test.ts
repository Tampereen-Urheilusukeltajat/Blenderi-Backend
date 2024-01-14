import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  jest,
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
import { validateTurnstileToken } from '../../../lib/auth/turnstile';

const USER_PAYLOAD = {
  email: 'erkki@sukeltaja.fi',
  phoneNumber: '00010',
  forename: 'Erkki',
  surname: 'Nitikka',
  password: 'superhyväsalasana',
  turnstileToken:
    '0H9sCE19DLgiaIBqjC6qTzYQb89Gk06cp60oX6j7K8YCr7mGCo0ddgZOj4J6G225BCjr2CZxfHeC082VUrdJ4fhfdMwfL3aLerRcdmQDuH8ypXeincJa5xWFjdHacljsXbZBUZGMcynpEcPmhtUsNYx7JMXLoyrSV0bYwnAfEUrhqC9NHbaLchQYbQXDrhGmD09ujj0tMARCnEZ0lOmgtHez6WYE9JG1QkJYnRj9CxrPqXItNxkv5uUl7Qel64pvZIW6KhaHjma13IaV5C3sZ5tBHRJRXVOSIpg0Sir1VAE9yNQsF0SJMwB9unOlC6t3Jt1oHy1vBMIjhaMNN1vr0fMsgOih007Ftwa7GZhJK4r69suj1zddggA78tTTE9daEZMeh15yGICPZHBukkJF79gmaiJcf1pQli2eqi8dd20RzZuXQOzhRkYbPTKx2RuWOmd1EXnTjYG6YL7fbIwHxyupNzIq5HNwF5oo4grNkv4XObTgmgfNdGPa79NaidIBPuzNH',
};

// Mock the fetch function
jest.mock('../../../lib/auth/turnstile');

describe('create user', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('create_user');
    await startRedisConnection();
    // @ts-expect-error One word: perkele
    validateTurnstileToken.mockResolvedValue(true);
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
    await stopRedisConnection();
  });

  /**
   * @TODO Modify tests so that they are truly independent (do not depend on
   * each others results)
   */
  describe('happy paths', () => {
    test('it responds with 201 if user is created', async () => {
      const server = await getTestInstance();
      const res = await server.inject({
        url: 'api/user',
        method: 'POST',
        payload: USER_PAYLOAD,
      });
      const responseBody = JSON.parse(res.body);

      expect(res.statusCode).toEqual(201);
      expect(responseBody.email).toEqual(USER_PAYLOAD.email);
      expect(responseBody.forename).toEqual(USER_PAYLOAD.forename);
      expect(responseBody.surname).toEqual(USER_PAYLOAD.surname);
      expect(responseBody.phoneNumber).toEqual(USER_PAYLOAD.phoneNumber);
      expect(responseBody).toHaveProperty('id');
      expect(responseBody).not.toHaveProperty('password');
      expect(responseBody).not.toHaveProperty('salt');
    });

    test('it accepts utf-8 characters (🦴)', async () => {
      const server = await getTestInstance();
      const res = await server.inject({
        url: 'api/user',
        method: 'POST',
        payload: {
          email: 'pertti@sukeltaja.fi',
          phoneNumber: '00011',
          forename: '🦴',
          surname: '🦴',
          password: '🦴🦴🦴🦴🦴🦴🦴🦴',
          turnstileToken:
            '0H9sCE19DLgiaIBqjC6qTzYQb89Gk06cp60oX6j7K8YCr7mGCo0ddgZOj4J6G225BCjr2CZxfHeC082VUrdJ4fhfdMwfL3aLerRcdmQDuH8ypXeincJa5xWFjdHacljsXbZBUZGMcynpEcPmhtUsNYx7JMXLoyrSV0bYwnAfEUrhqC9NHbaLchQYbQXDrhGmD09ujj0tMARCnEZ0lOmgtHez6WYE9JG1QkJYnRj9CxrPqXItNxkv5uUl7Qel64pvZIW6KhaHjma13IaV5C3sZ5tBHRJRXVOSIpg0Sir1VAE9yNQsF0SJMwB9unOlC6t3Jt1oHy1vBMIjhaMNN1vr0fMsgOih007Ftwa7GZhJK4r69suj1zddggA78tTTE9daEZMeh15yGICPZHBukkJF79gmaiJcf1pQli2eqi8dd20RzZuXQOzhRkYbPTKx2RuWOmd1EXnTjYG6YL7fbIwHxyupNzIq5HNwF5oo4grNkv4XObTgmgfNdGPa79NaidIBPuzNH',
        },
      });
      const responseBody = JSON.parse(res.body);

      expect(res.statusCode).toEqual(201);
      expect(responseBody.forename).toEqual('🦴');
      expect(responseBody.surname).toEqual('🦴');
    });

    describe('complex emails', () => {
      test('weird', async () => {
        const server = await getTestInstance();
        const res = await server.inject({
          url: 'api/user',
          method: 'POST',
          payload: {
            ...USER_PAYLOAD,
            email: 'email@[123.123.123.123]',
            phoneNumber: '020204',
          },
        });
        expect(res.statusCode).toEqual(201);
      });

      test('+', async () => {
        const server = await getTestInstance();
        const res = await server.inject({
          url: 'api/user',
          method: 'POST',
          payload: {
            ...USER_PAYLOAD,
            email: 'ile+harrastussahkoposti@ilesoft.fi',
            phoneNumber: '020205',
          },
        });
        expect(res.statusCode).toEqual(201);
      });
    });
  });

  describe('unhappy paths', () => {
    test('it responds with 409 if email already exists with another user', async () => {
      const server = await getTestInstance();
      const res = await server.inject({
        url: 'api/user',
        method: 'POST',
        payload: {
          ...USER_PAYLOAD,
          email: 'admin@admin.com', // already exists
        },
      });

      expect(res.statusCode).toEqual(409);
    });

    test('it responds with 409 if phone number already exists with another user', async () => {
      const server = await getTestInstance();
      const res = await server.inject({
        url: 'api/user',
        method: 'POST',
        payload: {
          ...USER_PAYLOAD,
          email: 'example@example.com',
          phoneNumber: '00001', // already exists
        },
      });

      expect(res.statusCode).toEqual(409);
    });

    test('it responds with 400 if payload is missing', async () => {
      const server = await getTestInstance();
      const res = await server.inject({
        url: 'api/user',
        method: 'POST',
      });

      expect(res.statusCode).toEqual(400);
    });

    test('it responds with 400 if password is too short', async () => {
      const server = await getTestInstance();
      const res = await server.inject({
        url: 'api/user',
        method: 'POST',
        payload: {
          ...USER_PAYLOAD,
          password: '1234567',
        },
      });

      expect(res.statusCode).toEqual(400);
    });

    test('it responds with 400 if forename is empty', async () => {
      const server = await getTestInstance();
      const res = await server.inject({
        url: 'api/user',
        method: 'POST',
        payload: {
          ...USER_PAYLOAD,
          forename: '',
        },
      });

      expect(res.statusCode).toEqual(400);
    });

    test('it responds with 400 if forename is missing', async () => {
      const server = await getTestInstance();
      const res = await server.inject({
        url: 'api/user',
        method: 'POST',
        payload: {
          ...USER_PAYLOAD,
          email: 'erkki@sukeltaja.fi',
          surname: 'Nitikka',
          password: 'superhyväsalasana',
          forename: undefined,
        },
      });

      expect(res.statusCode).toEqual(400);
    });

    test('it responds with 400 if turnstileToken is missing', async () => {
      const server = await getTestInstance();
      const res = await server.inject({
        url: 'api/user',
        method: 'POST',
        payload: {
          ...USER_PAYLOAD,
          turnstileToken: undefined,
        },
      });

      expect(res.statusCode).toEqual(400);
    });

    test('it responds with 403 if turnstileToken validation fails', async () => {
      // @ts-expect-error One word: perkele
      validateTurnstileToken.mockResolvedValue(false);

      const server = await getTestInstance();
      const res = await server.inject({
        url: 'api/user',
        method: 'POST',
        payload: USER_PAYLOAD,
      });

      expect(res.statusCode).toEqual(403);
    });
  });
});
