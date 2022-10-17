import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { createTestDatabase, dropTestDatabase } from '../../../lib/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';

const NEW_CYLINDER_SET_PAYLOAD = {
  owner: '1',
  name: 'bottle',
  cylinders: [
    {
      volume: 15,
      pressure: 200,
      material: 'steel',
      serialNumber: '3540965436löj564',
      inspection: '2020-01-01',
    },
  ],
};

describe('create cylinder set', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('create_cylinder_set');
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
  });

  test('it responds with 201 and proper body if creation was successful', async () => {
    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set',
      method: 'POST',
      payload: NEW_CYLINDER_SET_PAYLOAD,
    });

    expect(res.statusCode).toEqual(201);
    const responseBody = JSON.parse(res.body);

    // remove ids to enable comparison.
    delete responseBody.id;
    delete responseBody.cylinders[0].id;

    expect(responseBody).toEqual(NEW_CYLINDER_SET_PAYLOAD);
  });

  // TODO: Test with missing user
  // TODO: Test with invalid data volume = 0 etc
});
