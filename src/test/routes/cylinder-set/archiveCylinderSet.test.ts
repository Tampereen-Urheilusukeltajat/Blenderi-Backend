import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
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
import { DivingCylinderSet } from '../../../types/divingCylinderSet.types';

describe('delete cylinder set', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('delete_cylinder_set');
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
        email: 'delete@taursu.fi',
        password: 'salasana',
      },
    });
    const tokens = JSON.parse(res.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
  });

  describe('authenticated', () => {
    beforeEach(async () => {
      server = await getTestInstance();
      const res = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'delete@taursu.fi',
          password: 'salasana',
        },
      });
      const tokens = JSON.parse(res.body);
      headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
    });

    test('it responses 200 when set is archived', async () => {
      const divingCylinderSetId = 'f4e1035e-f36e-4056-9a1b-5925a3c5793e';

      const res = await server.inject({
        url: `api/cylinder-set/${divingCylinderSetId}/archive`,
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(200);
      const responseBody = JSON.parse(res.body);
      expect(responseBody.divingCylinderSetId).toEqual(divingCylinderSetId);

      // Set is archived from diving_cylinder_set
      const setResponse = await knexController
        .select('archived')
        .from<DivingCylinderSet>('diving_cylinder_set')
        .where('id', divingCylinderSetId);

      expect(setResponse[0]).toEqual({ archived: 1 });

      // only given dc set is archived
      const response1 = await knexController
        .select('id')
        .from('diving_cylinder_set')
        .where('archived', 1);

      expect(response1.length).toEqual(1);
    });

    test('it responses 404 when no set with given id', async () => {
      const res = await server.inject({
        url: 'api/cylinder-set/f5e1165e-f36e-4056-9a1b-5925a3c5793e/archive',
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(404);
    });
    test('it responses 400 when no id given', async () => {
      const res = await server.inject({
        url: 'api/cylinder-set/',
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(404);
    });

    test('it responses 400 when malformed id', async () => {
      const res = await server.inject({
        url: 'api/cylinder-set/false',
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(400);
    });
  });

  test('it responds with 401 if request is unauthenticated', async () => {
    const res = await server.inject({
      url: 'api/cylinder-set/a4e1035e-f36e-4056-9a1b-5925a3c5793e',
      method: 'PATCH',
      headers: { Authorization: 'Bearer definitely not valid jwt token' },
    });

    expect(res.statusCode).toEqual(401);
    const responseBody = JSON.parse(res.body);

    expect(responseBody).toEqual({ statusCode: 401, error: 'Unauthorized' });
  });
});
