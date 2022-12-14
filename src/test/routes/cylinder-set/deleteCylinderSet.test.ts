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
import { Cylinder, CylinderSet } from '../../../types/cylinderSet.types';

describe('delete cylinder set', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('delete_cylinder_set');
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
        email: 'delete@taursu.fi',
        password: 'salasana',
      },
    });
    const tokens = JSON.parse(res.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
  });

  test('it responses 200 when set is deleted', async () => {
    const cylinderSetId = 'f4e1035e-f36e-4056-9a1b-5925a3c5793e';

    const res = await server.inject({
      url: 'api/cylinder-set/' + cylinderSetId,
      method: 'DELETE',
      headers,
    });

    expect(res.statusCode).toEqual(200);
    const responseBody = JSON.parse(res.body);
    expect(responseBody.setID).toEqual(cylinderSetId);

    // Set is deleted from diving_cylinder_set
    const setResponse = await knexController
      .select('id')
      .from<CylinderSet>('diving_cylinder_set')
      .where('id', cylinderSetId);

    expect(setResponse).toEqual([]);

    // Set is deleted from diving_cylinder_to_set
    const toSetResponse = await knexController
      .select('cylinder_set')
      .from('diving_cylinder_to_set')
      .where('cylinder_set', cylinderSetId);

    expect(toSetResponse).toEqual([]);

    // Single cylinders are all deleted from diving_cylinder

    // cylinders in given set.
    const cylinders = [
      '1e54c95c-c2fe-4d86-9406-c88f45c0bde9',
      '362ab1b8-4f88-11ed-aa8f-a7bc5ca309a3',
    ];
    const cylinderResponse = await knexController
      .select('id')
      .from<Cylinder>('diving_cylinder')
      .whereIn('id', cylinders);

    // Before delete there is 4 cylinders and 2 should be deleted.
    expect(cylinderResponse.length).toEqual(2);

    // only given set is deleted.
    const response1 = await knexController
      .select('id')
      .from('diving_cylinder_set');
    // Before delete, there were 3 sets.
    expect(response1.length).toEqual(2);
  });

  test('it responses 404 when no set with given id', async () => {
    const res = await server.inject({
      url: 'api/cylinder-set/f5e1165e-f36e-4056-9a1b-5925a3c5793e',
      method: 'DELETE',
      headers,
    });

    expect(res.statusCode).toEqual(404);
  });
  test('it responses 404 when no id given', async () => {
    const res = await server.inject({
      url: 'api/cylinder-set/',
      method: 'DELETE',
      headers,
    });

    expect(res.statusCode).toEqual(404);
  });

  test('it responses 400 when malformed id', async () => {
    const res = await server.inject({
      url: 'api/cylinder-set/false',
      method: 'DELETE',
      headers,
    });

    expect(res.statusCode).toEqual(400);
  });

  test('it responds with 401 if request is unauthenticated', async () => {
    const res = await server.inject({
      url: 'api/cylinder-set/a4e1035e-f36e-4056-9a1b-5925a3c5793e',
      method: 'DELETE',
      headers: { Authorization: 'Bearer definitely not valid jwt token' },
    });

    expect(res.statusCode).toEqual(401);
    const responseBody = JSON.parse(res.body);

    expect(responseBody).toEqual({ statusCode: 401, error: 'Unauthorized' });
  });
});
