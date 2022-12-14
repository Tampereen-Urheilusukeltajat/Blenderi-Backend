import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { createTestDatabase, dropTestDatabase } from '../../../lib/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import { CylinderSet } from '../../../types/cylinderSet.types';

describe('select cylinder set', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('select_cylinder_set');
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
  });

  let server;
  let headers: object;
  beforeEach(async () => {
    server = await getTestInstance();
    const res = await server.inject({
      url: '/api/login',
      method: 'POST',
      payload: {
        email: 'user@taursu.fi',
        password: 'salasana',
      },
    });
    const tokens = JSON.parse(res.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
  });

  test('responds with 200 when there are cylinder sets in the database and no id is specified', async () => {
    const res = await server.inject({
      url: `api/cylinder-set/`,
      method: 'GET',
      headers,
    });

    expect(res.statusCode).toEqual(200);
  });

  test('responds with 200 when one or more cylinder sets exist with given owner', async () => {
    const owner = 'a59faf66-4f75-11ed-98ae-77941df77788';

    const res = await server.inject({
      url: `api/cylinder-set/${owner}`,
      method: 'GET',
      headers,
    });

    expect(res.statusCode).toEqual(200);
    const reply: CylinderSet[] = res.json();
    expect(reply[0].id).toEqual('a4e1035e-f36e-4056-9a1b-5925a3c5793e');
    expect(reply[0].owner).toEqual('a59faf66-4f75-11ed-98ae-77941df77788');
    expect(reply[0].name).toEqual('aa');
  });

  test('responds with empty array when cylinder sets do not exist with given owner', async () => {
    const owner = 'a59faf66-4f75-11ed-98ae-77941df77789';

    const res = await server.inject({
      url: `api/cylinder-set/${owner}`,
      method: 'GET',
      headers,
    });

    const reply: CylinderSet[] = res.json();
    expect(reply.length === 0).toBeTruthy();
  });

  test('it responds with 401 if request is unauthenticated', async () => {
    const owner = 'a59faf66-4f75-11ed-98ae-77941df77788';

    const res = await server.inject({
      url: `api/cylinder-set/${owner}`,
      method: 'GET',
    });

    expect(res.statusCode).toEqual(401);
    const responseBody = JSON.parse(res.body);

    expect(responseBody).toEqual({ statusCode: 401, error: 'Unauthorized' });
  });
});
