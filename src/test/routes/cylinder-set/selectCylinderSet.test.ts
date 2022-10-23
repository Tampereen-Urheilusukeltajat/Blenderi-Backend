import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { createTestDatabase, dropTestDatabase } from '../../../lib/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';

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

  test('responds with 200 when there are cylinder sets in the database and no id is specified', async () => {
    const server = await getTestInstance();

    const res = await server.inject({
      url: `api/cylinder-set/`,
      method: 'GET',
    });

    expect(res.statusCode).toEqual(200);
  });

  test('responds with 200 when cylinder set exists with given id', async () => {
    const setId = 'f4e1035e-f36e-4056-9a1b-5925a3c5793e';
    const server = await getTestInstance();

    const res = await server.inject({
      url: `api/cylinder-set/${setId}`,
      method: 'GET',
    });

    expect(res.statusCode).toEqual(200);
  });

  test('responds with 200 when one or more cylinder sets exist with given owner', async () => {
    const owner = 'a59faf66-4f75-11ed-98ae-77941df77788';
    const server = await getTestInstance();

    const res = await server.inject({
      url: `api/cylinder-set/owner/${owner}`,
      method: 'GET',
    });

    expect(res.statusCode).toEqual(200);
  });

  test('responds with 404 when cylinder sets do not exist with given owner', async () => {
    const owner = 'a59faf66-4f75-11ed-98ae-77941df77789';
    const server = await getTestInstance();

    const res = await server.inject({
      url: `api/cylinder-set/owner/${owner}`,
      method: 'GET',
    });

    expect(res.statusCode).toEqual(404);
  });

  test('responds with 404 when cylinder does not exist with given id', async () => {
    const setId = 'f4e1035e-f36e-4056-9a1b-5925a3c5793f';
    const server = await getTestInstance();

    const res = await server.inject({
      url: `api/cylinder-set/${setId}`,
      method: 'GET',
    });

    expect(res.statusCode).toEqual(404);
  });
});
