import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { createTestDatabase, dropTestDatabase } from '../../../lib/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';

const USER_PAYLOAD = {
  email: 'erkki@sukeltaja.fi',
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
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
  });

  // test('it responds with 400 if payload is missing', async () => {});
  test('it responds with 409 if email already exists with another user', async () => {
    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/user',
      method: 'POST',
      payload: {
        ...USER_PAYLOAD,
        email: 'admin@admin.com',
      },
    });

    expect(res.statusCode).toEqual(409);
  });
  // test('it responds with 409 if phone number already exists with another user', async () => {});
  // test('it responds with 201 if user is created', async () => {});
});
