/* eslint-disable @typescript-eslint/no-misused-promises */
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { knexController } from '../../../../database/database';
import { EditUserResponse } from '../../../../types/user.types';
import { buildServer } from '../../../../server';
import { createTestDatabase, dropTestDabase } from '../../../lib/testUtils';

describe('update user', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('update_user');
  });

  afterAll(async () => {
    await dropTestDabase();
    await knexController.destroy();
  });

  const updatedUser = {
    email: 'change@email.fi',
    forename: 'Edited',
    surname: 'Change',
    isAdmin: true,
    isBlender: false,
  };

  test('it returns obj with updated values', async () => {
    const server = await getTestInstance();

    const res = await server.inject({
      url: 'api/user/user/2/',
      payload: updatedUser,
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    const resBody = JSON.parse(res.body) as EditUserResponse;
    expect(resBody).toEqual({
      ...updatedUser,
      id: '2',
    });
  });

  test('it returns 404', async () => {
    const server = await getTestInstance();

    const res = await server.inject({
      url: 'api/user/user/9999/',
      payload: updatedUser,
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    expect(res.statusCode).toEqual(404);

    const resBody = JSON.parse(res.body) as EditUserResponse;

    expect(resBody).toHaveProperty('error');
    expect(resBody).toHaveProperty('message');
  });

  test('it returns 500', async () => {
    const server = await getTestInstance();

    const res = await server.inject({
      url: 'api/user/user/2',
      // incorrect payload
      payload: { kakka: '1234' },
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    expect(res.statusCode).toEqual(500);

    const resBody = JSON.parse(res.body) as EditUserResponse;

    expect(resBody).toHaveProperty('error');
    expect(resBody).toHaveProperty('message');
  });
});
