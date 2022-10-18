import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { createTestDatabase, dropTestDatabase } from '../../../lib/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';

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
    const payload = {
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

    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set',
      method: 'POST',
      payload,
    });

    expect(res.statusCode).toEqual(201);
    const responseBody = JSON.parse(res.body);

    // remove ids to enable comparison.
    delete responseBody.id;
    delete responseBody.cylinders[0].id;

    expect(responseBody.cylinders[0].inspection).toContain(
      payload.cylinders[0].inspection
    );
    delete responseBody.cylinders[0].inspection;

    payload.cylinders[0].inspection = responseBody.cylinders[0].inspection;
    expect(responseBody).toEqual(payload);
  });

  test('it responds with 201 and proper body if creation of multiple cylinder set was successful', async () => {
    const payload = {
      owner: '1',
      name: 'bottle0.1',
      cylinders: [
        {
          volume: 15,
          pressure: 200,
          material: 'steel',
          serialNumber: '3540965436löj564',
          inspection: '2020-01-01',
        },
        {
          volume: 15,
          pressure: 200,
          material: 'steel',
          serialNumber: 'ihanerokoodi',
          inspection: '2020-01-03',
        },
      ],
    };

    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set',
      method: 'POST',
      payload,
    });

    expect(res.statusCode).toEqual(201);
    const responseBody = JSON.parse(res.body);

    // remove ids and dates to enable comparison.
    delete responseBody.id;
    delete responseBody.cylinders[0].id;
    delete responseBody.cylinders[1].id;
    payload.cylinders[0].inspection = responseBody.cylinders[0].inspection;
    payload.cylinders[1].inspection = responseBody.cylinders[1].inspection;

    expect(responseBody).toEqual(payload);
  });

  test('it responds with 400 if one of those cylinder inspection date are in the future', async () => {
    const date = new Date();
    date.setUTCFullYear(date.getUTCFullYear() + 2);
    const payload = {
      owner: '1',
      name: 'bottle2',
      cylinders: [
        {
          volume: 15,
          pressure: 200,
          material: 'aluminium',
          serialNumber: '3540965436löj564',
          inspection: date.toISOString(),
        },
      ],
    };
    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set',
      method: 'POST',
      payload,
    });

    expect(res.statusCode).toEqual(400);
    expect(JSON.parse(res.body).message).toEqual(
      'Inspection date from the future'
    );
  });

  test('it responds with 409 if same user tries to create 2 cylinder sets with the same name', async () => {
    const payload1 = {
      owner: '1',
      name: 'bottle3',
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

    const payload2 = {
      owner: '1',
      name: 'bottle3',
      cylinders: [
        {
          volume: 10,
          pressure: 300,
          material: 'carbon fiber',
          serialNumber: '35',
          inspection: '2020-01-01',
        },
      ],
    };

    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set',
      method: 'POST',
      payload: payload1,
    });

    expect(res.statusCode).toEqual(201);

    const res2 = await server.inject({
      url: 'api/cylinder-set',
      method: 'POST',
      payload: payload2,
    });

    expect(res2.statusCode).toEqual(409);
  });

  test('it responds with 400 if user does not exists', async () => {
    const payload = {
      owner: '0', // not in user.csv
      name: 'bottle4',
      cylinders: [
        {
          volume: 15,
          pressure: 200,
          material: 'aluminium',
          serialNumber: '3540965436löj564',
          inspection: '2022-10-18T07:30:10.184Z',
        },
      ],
    };
    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set',
      method: 'POST',
      payload,
    });

    expect(res.statusCode).toEqual(400);
    expect(JSON.parse(res.body).message).toEqual('User not found');
  });

  test('it responds with 400 if some cylinder has invalid value for volume', async () => {
    const payload = {
      owner: '1',
      name: 'bottle5',
      cylinders: [
        {
          volume: -1,
          pressure: 200,
          material: 'aluminium',
          serialNumber: '3540965436löj564',
          inspection: '2022-10-18T07:30:10.184Z',
        },
      ],
    };
    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set',
      method: 'POST',
      payload,
    });

    expect(res.statusCode).toEqual(400);
  });

  test('it responds with 400 if some cylinder has invalid value for pressure', async () => {
    const payload = {
      owner: '1',
      name: 'bottle6',
      cylinders: [
        {
          volume: 15,
          pressure: 0,
          material: 'aluminium',
          serialNumber: '3540965436löj564',
          inspection: '2022-10-18T07:30:10.184Z',
        },
      ],
    };
    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set',
      method: 'POST',
      payload,
    });

    expect(res.statusCode).toEqual(400);
  });

  test('it responds with 400 if set does not have cylinders', async () => {
    const payload = {
      owner: '1',
      name: 'bottle7',
      cylinders: [],
    };
    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set',
      method: 'POST',
      payload,
    });

    expect(res.statusCode).toEqual(400);
  });

  test('it responds with 400 if set name is too long', async () => {
    const payload = {
      owner: '1',
      name: 'bottle88888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888',
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

    const server = await getTestInstance();
    const res = await server.inject({
      url: 'api/cylinder-set',
      method: 'POST',
      payload,
    });

    expect(res.statusCode).toEqual(400);
  });
});
