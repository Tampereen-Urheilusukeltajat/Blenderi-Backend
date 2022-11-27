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
    test('it creates a new fill event with only compressed air', async () => {
      const PAYLOAD = {
        cylinderSetId: 'a4e1035e-f36e-4056-9a1b-5925a3c5793e', // single cylinder set
        gasMixture: 'Paineilma',
        filledAir: true,
        storageCylinderUsageArr: [],
      };
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'POST',
        body: PAYLOAD,
        headers,
      });
      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(201);
      expect(resBody.price).toEqual(0);
    });
    test('it creates a new fill event with blender priviledges', async () => {
      const PAYLOAD = {
        cylinderSetId: 'b4e1035e-f36e-4056-9a1b-5925a3c5793e',
        gasMixture: 'seos',
        filledAir: false,
        storageCylinderUsageArr: [
          {
            storageCylinderId: 1,
            startPressure: 10,
            endPressure: 8,
          },
          {
            storageCylinderId: 5,
            startPressure: 13.5,
            endPressure: 10.2,
          },
        ],
        description: 'Tämä on jonkinlainen seos',
      };
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'POST',
        body: PAYLOAD,
        headers,
      });
      const resBody = JSON.parse(res.body);
      const expectedPrice =
        (PAYLOAD.storageCylinderUsageArr[0].startPressure -
          PAYLOAD.storageCylinderUsageArr[0].endPressure) *
          50 *
          300 +
        (PAYLOAD.storageCylinderUsageArr[1].startPressure -
          PAYLOAD.storageCylinderUsageArr[1].endPressure) *
          50 *
          150;
      expect(res.statusCode).toEqual(201);
      expect(resBody.price).toEqual(expectedPrice);
    });
  });

  describe('unsuccesful', () => {
    test('it fails when no gases are given', async () => {
      const PAYLOAD = {
        cylinderSetId: 'f4e1035e-f36e-4056-9a1b-5925a3c5793e',
        airPressure: 0,
        storageCylinderUsageArr: [],
        description: 'Tämä on ylimääräistä infoa',
      };
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'POST',
        body: PAYLOAD,
        headers,
      });
      expect(res.statusCode).toEqual(400);
    });

    test('it fails with invalid cylinder set', async () => {
      const PAYLOAD = {
        cylinderSetId: 'a4e1035e-f36e-4056-9a1b-696969696969',
        airPressure: 12,
        storageCylinderUsageArr: [],
        description: 'Tämä on ylimääräistä infoa',
      };
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'POST',
        body: PAYLOAD,
        headers,
      });
      expect(res.statusCode).toEqual(400);
    });

    test('it fails with negative air pressure', async () => {
      const PAYLOAD = {
        cylinderSetId: 'f4e1035e-f36e-4056-9a1b-5925a3c5793e',
        airPressure: -4,
        storageCylinderUsageArr: [],
        description: 'Tämä on ylimääräistä infoa',
      };
      const res = await server.inject({
        url: 'api/fill-event',
        method: 'POST',
        body: PAYLOAD,
        headers,
      });
      expect(res.statusCode).toEqual(400);
    });

    test('it fails with negative storageCylinder pressure', async () => {
      const PAYLOAD = {
        cylinderSetId: 'f4e1035e-f36e-4056-9a1b-5925a3c5793e',
        airPressure: 10,
        storageCylinderUsageArr: [
          {
            storageCylinderId: 1,
            startPressure: 10,
            endPressure: 8,
          },
        ],
        description: 'Tämä on ylimääräistä infoa',
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
      const login = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'oujeaasd@XD.fi',
          password: 'password',
        },
      });
      const tokens = JSON.parse(login.body);
      headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
      const PAYLOAD = {
        cylinderSetId: 'b4e1035e-f36e-4056-9a1b-5925a3c57100',
        gasMixture: 'EAN32',
        filledAir: true,
        storageCylinderUsageArr: [
          {
            storageCylinderId: 1,
            startPressure: 10,
            endPressure: 8,
          },
        ],
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
