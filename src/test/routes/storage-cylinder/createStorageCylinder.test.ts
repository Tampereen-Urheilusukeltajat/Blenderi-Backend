import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { type FastifyInstance } from 'fastify';
import {
  createTestDatabase,
  dropTestDatabase,
  startRedisConnection,
  stopRedisConnection,
} from '../../../lib/utils/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import {
  type CreateStorageCylinderBody,
  type StorageCylinder,
} from '../../../types/storageCylinder.types';

const VALID_PAYLOAD: CreateStorageCylinderBody = {
  gasId: '1',
  maxPressure: 200,
  name: '1',
  volume: 50,
};

const INVALID_PAYLOAD: Partial<CreateStorageCylinderBody> = {
  gasId: '1',
  name: '1',
  volume: 50,
};

const INVALID_PAYLOAD_NON_EXISTENT_GAS: CreateStorageCylinderBody = {
  gasId: '42',
  maxPressure: 200,
  name: '1',
  volume: 50,
};

describe('Create storage cylinder', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('create_storage_cylinder');
    await startRedisConnection();
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
    await stopRedisConnection();
  });

  let server: FastifyInstance;
  let headers: { Authorization: string };
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

  describe('Happy path', () => {
    test('responds 201 if the storageCylinder has been created successfully', async () => {
      const res = await server.inject({
        headers,
        method: 'POST',
        payload: VALID_PAYLOAD,
        url: 'api/storage-cylinder',
      });

      expect(res.statusCode).toEqual(201);
      const body: StorageCylinder = JSON.parse(res.body);

      expect(body).toMatchInlineSnapshot(`
        {
          "gasId": "1",
          "id": "1",
          "maxPressure": 200,
          "name": "1",
          "volume": 50,
        }
      `);

      const [{ ...dbSC }] = await knexController('storage_cylinder').where(
        'id',
        body.id,
      );
      delete dbSC.created_at;
      delete dbSC.updated_at;
      expect(dbSC).toMatchInlineSnapshot(`
        {
          "gas_id": 1,
          "id": 1,
          "max_pressure": 200,
          "name": "1",
          "volume": 50,
        }
      `);
    });
  });

  describe('Unhappy path', () => {
    test('responds 401 if authentication header was not provided', async () => {
      const res = await server.inject({
        method: 'POST',
        payload: VALID_PAYLOAD,
        url: 'api/storage-cylinder',
      });

      expect(res.statusCode).toEqual(401);
    });

    test('responds 400 if required body property is missing', async () => {
      const res = await server.inject({
        headers,
        method: 'POST',
        payload: INVALID_PAYLOAD,
        url: 'api/storage-cylinder',
      });

      expect(res.statusCode).toEqual(400);
      expect(JSON.parse(res.payload).message).toEqual(
        "body must have required property 'maxPressure'",
      );
    });

    test('responds 400 if it is not able to find gas with the given gasId', async () => {
      const res = await server.inject({
        headers,
        method: 'POST',
        payload: INVALID_PAYLOAD_NON_EXISTENT_GAS,
        url: 'api/storage-cylinder',
      });

      expect(res.statusCode).toEqual(400);
      expect(JSON.parse(res.payload).message).toEqual('Gas does not exist');
    });
  });
});
