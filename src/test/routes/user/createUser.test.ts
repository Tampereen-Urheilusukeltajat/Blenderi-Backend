import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import {
  createTestDatabase,
  dropTestDatabase,
  startRedisConnection,
  stopRedisConnection,
} from '../../../lib/utils/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';

const USER_PAYLOAD = {
  email: 'erkki@sukeltaja.fi',
  phoneNumber: '00010',
  forename: 'Erkki',
  surname: 'Nitikka',
  password: 'superhyväsalasana',
};

describe('create user', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('create_user');
    await startRedisConnection();
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
          email: 'erkki@sukeltaja.fi',
          surname: 'Nitikka',
          password: 'superhyväsalasana',
        },
      });

      expect(res.statusCode).toEqual(400);
    });
  });
});
