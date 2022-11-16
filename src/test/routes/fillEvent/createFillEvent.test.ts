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

describe('create fill event', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('create_fill_event');
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
        email: 'test@email.fi',
        password: 'password',
      },
    });
    const tokens = JSON.parse(res.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
  });

  describe('successful', () => {
    test('it creates a new fill event with blender priviledges', async () => {
      const PAYLOAD = {
        userId: '54e3e8b0-53d4-11ed-9342-0242ac120002',
        cylinderSetId: 'a4e1035e-f36e-4056-9a1b-5925a3c5793e',
        airPressure: 12,
        oxygenPressure: 4,
        heliumPressure: 4,
        argonPressure: 1,
        diluentPressure: 0,
        info: 'Tämä on ylimääräistä infoa',
      };
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'POST',
        body: PAYLOAD,
        headers,
      });
      expect(res.statusCode).toEqual(201);
    });
    test('the price is right', async () => {
      // todo
      expect(false).toBeTruthy();
    });
  });

  describe('unsuccesful', () => {
    test('it fails when no gases are given', async () => {
      const PAYLOAD = {
        userId: '54e3e8b0-53d4-11ed-9342-0242ac120002',
        cylinderSetId: 'a4e1035e-f36e-4056-9a1b-5925a3c5793e',
        airPressure: 0,
        oxygenPressure: 0,
        heliumPressure: 0,
        argonPressure: 0,
        diluentPressure: 0,
        info: 'Tämä on ylimääräistä infoa',
      };
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'POST',
        body: PAYLOAD,
        headers,
      });
      expect(res.statusCode).toEqual(400);
    });

    test('it fails with invalid user', async () => {
      const PAYLOAD = {
        userId: '54e3e8b0-53d4-11ed-9342-0242ac696969',
        cylinderSetId: 'a4e1035e-f36e-4056-9a1b-5925a3c5793e',
        airPressure: 12,
        oxygenPressure: 0,
        heliumPressure: 0,
        argonPressure: 0,
        diluentPressure: 0,
        info: 'Tämä on ylimääräistä infoa',
      };
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'POST',
        body: PAYLOAD,
        headers,
      });
      expect(res.statusCode).toEqual(404);
    });

    test('it fails with invalid cylinder set', async () => {
      const PAYLOAD = {
        userId: '54e3e8b0-53d4-11ed-9342-0242ac120002',
        cylinderSetId: 'a4e1035e-f36e-4056-9a1b-696969696969',
        airPressure: 12,
        oxygenPressure: 0,
        heliumPressure: 0,
        argonPressure: 0,
        diluentPressure: 0,
        info: 'Tämä on ylimääräistä infoa',
      };
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'POST',
        body: PAYLOAD,
        headers,
      });
      expect(res.statusCode).toEqual(404);
    });

    test('it fails with negative gas amounts', async () => {
      const PAYLOAD = {
        userId: '54e3e8b0-53d4-11ed-9342-0242ac120002',
        cylinderSetId: 'a4e1035e-f36e-4056-9a1b-5925a3c5793e',
        airPressure: -4,
        oxygenPressure: -3,
        heliumPressure: -55,
        argonPressure: -23,
        diluentPressure: -9,
        info: 'Tämä on ylimääräistä infoa',
      };
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'POST',
        body: PAYLOAD,
        headers,
      });
      expect(res.statusCode).toEqual(400);
    });
    test('it fails if the user does not have blender priviledges', async () => {
      const PAYLOAD = {
        userId: 'f03b9a1b-65d6-11ed-8432-0242ac120002',
        cylinderSetId: 'b4e1035e-f36e-4056-9a1b-5925a3c57100',
        airPressure: 0,
        oxygenPressure: 1,
        heliumPressure: 3,
        argonPressure: 4,
        diluentPressure: 0,
        info: 'Tämä on ylimääräistä infoa',
      };
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'POST',
        body: PAYLOAD,
        headers,
      });
      expect(res.statusCode).toEqual(403);
    });
  });
});
