import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
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
      url: 'api/user/2/',
      payload: updatedUser,
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    const resBody = JSON.parse(res.body);
    expect(res.statusCode).toEqual(200);
    expect(resBody).toEqual({
      ...updatedUser,
      id: '2',
    });
  });

  test('it returns 404 when no user with given id.', async () => {
    const server = await getTestInstance();

    const res = await server.inject({
      url: 'api/user/9999/',
      payload: { ...updatedUser, email: 'random123@email.com' },
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    expect(res.statusCode).toEqual(404);

    const resBody = JSON.parse(res.body);

    expect(resBody).toHaveProperty('error');
    expect(resBody).toHaveProperty('message');
  });

  test('it returns 400 when invalid body parameter.', async () => {
    const server = await getTestInstance();

    const res = await server.inject({
      url: 'api/user/2/',
      // incorrect payload
      payload: { kakka: '1234' },
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    expect(res.statusCode).toEqual(400);

    const resBody = JSON.parse(res.body);

    expect(resBody).toHaveProperty('error');
    expect(resBody).toHaveProperty('message');
  });

  test('it returns 400 when empty body.', async () => {
    const server = await getTestInstance();

    const res = await server.inject({
      url: 'api/user/2/',
      // incorrect payload
      payload: {},
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    expect(res.statusCode).toEqual(400);

    const resBody = JSON.parse(res.body);

    expect(resBody).toHaveProperty('error');
    expect(resBody).toHaveProperty('message');
  });

  // 500 ok?
  test('it returns 500 when invalid type in body param.', async () => {
    const server = await getTestInstance();

    const res = await server.inject({
      url: 'api/user/2/',
      // incorrect payload type
      payload: { ...updatedUser, isAdmin: 'this is not boolean.' },
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    expect(res.statusCode).toEqual(500);

    const resBody = JSON.parse(res.body);

    expect(resBody).toHaveProperty('error');
    expect(resBody).toHaveProperty('message');
  });

  test('it returns 409 when email already in use.', async () => {
    const server = await getTestInstance();

    const res = await server.inject({
      url: 'api/user/2/',
      // incorrect payload type
      payload: { ...updatedUser, email: 'alreadyin@use.fi' },
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    expect(res.statusCode).toEqual(409);

    const resBody = JSON.parse(res.body);

    expect(resBody).toHaveProperty('error');
    expect(resBody).toHaveProperty('message');
  });

  test('password is not stored as plain text to db.', async () => {
    const server = await getTestInstance();

    const pass = 'plainpassword';

    const res = await server.inject({
      url: 'api/user/2/',
      // incorrect payload type

      payload: { password: pass },
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    expect(res.statusCode).toEqual(200);

    const passHash = knexController.select('password_hash').from('user');

    expect(passHash).not.toEqual(pass);
  });
});
