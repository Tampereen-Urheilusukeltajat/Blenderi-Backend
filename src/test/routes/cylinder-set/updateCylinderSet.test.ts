import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { createTestDatabase, dropTestDatabase } from '../../../lib/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';

describe('update cylinder set', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('update_cylinder_set');
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
  });

  test('it responds with 200 and proper body if update was successful; no cylinders updated', async () => {
    const payload = {
      name: 'bottlename',
    };

    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set/f4e1035e-f36e-4056-9a1b-5925a3c5793e',
      method: 'PATCH',
      payload,
    });

    expect(res.statusCode).toEqual(200);
    const responseBody = JSON.parse(res.body);
    expect(responseBody.name).toEqual(payload.name);
  });

  test('it responds with 200 and proper body if update of multiple cylinder in a set was successful', async () => {
    const payload = {
      cylinders: [
        {
          id: '1e54c95c-c2fe-4d86-9406-c88f45c0bde9',
          pressure: 232,
          inspection: '2022-01-01',
        },
        {
          id: '362ab1b8-4f88-11ed-aa8f-a7bc5ca309a3',
          inspection: '2021-01-03',
        },
      ],
    };

    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set/f4e1035e-f36e-4056-9a1b-5925a3c5793e',
      method: 'PATCH',
      payload,
    });

    const responseBody = JSON.parse(res.body);

    expect(res.statusCode).toEqual(200);

    for (const cylinder of responseBody.cylinders) {
      if (cylinder.id === '1e54c95c-c2fe-4d86-9406-c88f45c0bde9') {
        expect(cylinder.pressure).toEqual(232);
        expect(cylinder.inspection).toContain('2022-01-01');
      }
      if (cylinder.id === '362ab1b8-4f88-11ed-aa8f-a7bc5ca309a3') {
        expect(cylinder.inspection).toContain('2021-01-03');
      }
    }
  });

  test('it responds with 400 if cylinder set is not found', async () => {
    const payload = {
      name: 'pullonnimi',
      cylinders: [],
    };

    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set/05e3d142-4f79-11ed-a77d-7399a01cf8ab',
      method: 'PATCH',
      payload,
    });

    expect(res.statusCode).toEqual(404);
  });

  test('it responds with 409 if same user tries to update cylinder set to have conflicting name', async () => {
    const payload = {
      name: 'bb',
    };

    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set/a4e1035e-f36e-4056-9a1b-5925a3c5793e',
      method: 'PATCH',
      payload,
    });

    expect(res.statusCode).toEqual(409);
  });

  test('it responds with 400 for invalid body', async () => {
    const payload = {
      name: 'bottle5',
      cylinders: [
        {
          id: '1e54c95c-c2fe-4d86-9406-c88f45c0bde9',
          inspection: '🦀',
        },
      ],
    };
    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set/f4e1035e-f36e-4056-9a1b-5925a3c5793e',
      method: 'PATCH',
      payload,
    });

    expect(res.statusCode).toEqual(400);
  });
});
