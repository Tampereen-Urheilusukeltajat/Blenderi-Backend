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

describe('get cylinder sets', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('get_diving_cylinder_sets');
    await startRedisConnection();
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
    await stopRedisConnection();
  });

  let server;
  let headers: object;
  test('returns users diving cylinder sets', async () => {
    server = await getTestInstance();
    const authRes = await server.inject({
      url: '/api/login',
      method: 'POST',
      payload: {
        email: 'user@taursu.fi',
        password: 'salasana',
      },
    });
    const tokens = JSON.parse(authRes.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };

    const res = await server.inject({
      url: `api/cylinder-set/?userId=a59faf66-4f75-11ed-98ae-77941df77788`,
      method: 'GET',
      headers,
    });

    expect(res.statusCode).toEqual(200);

    const body = JSON.parse(res.body);
    expect(body.length).toEqual(3);
    expect(body).toMatchSnapshot();
  });

  test('does not allow reading other users diving cylinders', async () => {
    server = await getTestInstance();
    const authRes = await server.inject({
      url: '/api/login',
      method: 'POST',
      payload: {
        email: 'user@taursu.fi',
        password: 'salasana',
      },
    });
    const tokens = JSON.parse(authRes.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };

    const res = await server.inject({
      url: `api/cylinder-set/?userId=a59faf66-4f75-11ed-98ae-77941df77789`,
      method: 'GET',
      headers,
    });

    expect(res.statusCode).toEqual(403);
  });

  test('admin is able to read other users diving cylinders', async () => {
    server = await getTestInstance();
    const authRes = await server.inject({
      url: '/api/login',
      method: 'POST',
      payload: {
        email: 'admin@taursu.fi',
        password: 'salasana',
      },
    });
    const tokens = JSON.parse(authRes.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };

    const dcsResponse = await server.inject({
      url: `api/cylinder-set/?userId=a59faf66-4f75-11ed-98ae-77941df77788`,
      method: 'GET',
      headers,
    });

    expect(dcsResponse.statusCode).toEqual(200);

    const body = JSON.parse(dcsResponse.body);
    expect(body.length).toEqual(3);
  });

  test('returns empty array if user does not have cylinder sets', async () => {
    server = await getTestInstance();
    const authRes = await server.inject({
      url: '/api/login',
      method: 'POST',
      payload: {
        email: 'admin@taursu.fi',
        password: 'salasana',
      },
    });
    const tokens = JSON.parse(authRes.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };

    const dcsResponse = await server.inject({
      url: `api/cylinder-set/?userId=a59faf66-4f75-11ed-98ae-77941df77790`,
      method: 'GET',
      headers,
    });

    expect(dcsResponse.statusCode).toEqual(200);

    const body = JSON.parse(dcsResponse.body);
    expect(body).toEqual([]);
  });

  test('returns empty array if user is not found', async () => {
    server = await getTestInstance();
    const authRes = await server.inject({
      url: '/api/login',
      method: 'POST',
      payload: {
        email: 'admin@taursu.fi',
        password: 'salasana',
      },
    });
    const tokens = JSON.parse(authRes.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };

    const dcsResponse = await server.inject({
      url: `api/cylinder-set/?userId=a59faf66-4f75-11ed-98ae-77941df77799`,
      method: 'GET',
      headers,
    });

    expect(dcsResponse.statusCode).toEqual(200);

    const body = JSON.parse(dcsResponse.body);
    expect(body).toEqual([]);
  });
});
