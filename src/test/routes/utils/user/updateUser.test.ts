/* eslint-disable @typescript-eslint/no-misused-promises */
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { knexController } from '../../../../database/database';
import { EditUserResponse } from '../../../../types/user.types';
import { buildServer } from '../../../../server';

const dbUser = {
  id: 2,
  email: 'test@email.fi',
  forename: 'Tester',
  surname: 'Blender',
  is_admin: false,
  is_blender: true,
  password_hash: 'hash_#€&1!',
  salt: 'suolaa',
};

describe('update user', () => {
  const getTestIntance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await knexController.migrate.down();
    await knexController.migrate.up();
    await knexController('user').insert(dbUser);
  });

  afterAll(async () => {
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
    const server = await getTestIntance();

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
    const server = await getTestIntance();

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
    const server = await getTestIntance();

    const res = await server.inject({
      url: 'api/user/user/2',
      // incorrect payload
      payload: { kakka: '1234' },
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    expect(res.statusCode).toEqual(404);

    const resBody = JSON.parse(res.body) as EditUserResponse;

    expect(resBody).toHaveProperty('error');
    expect(resBody).toHaveProperty('message');
  });
});
