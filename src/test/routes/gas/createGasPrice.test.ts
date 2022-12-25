import {
  jest,
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
import { CreateGasPrice, GasPrice } from '../../../types/gas.types';

const VALID_PAYLOAD: CreateGasPrice = {
  activeFrom: '2022-01-01',
  activeTo: '2022-12-31',
  gasId: 1,
  priceEurCents: 4,
};

const VALID_PAYLOAD_ACTIVE_TO_UNDEFINED: CreateGasPrice = {
  activeFrom: '2023-02-01',
  activeTo: undefined,
  gasId: 1,
  priceEurCents: 7,
};

const INVALID_PAYLOAD: Partial<CreateGasPrice> = {
  activeFrom: '',
  gasId: 1,
};

const INVALID_PAYLOAD_NON_EXISTENT_GAS: CreateGasPrice = {
  activeFrom: '',
  activeTo: '',
  gasId: 42,
  priceEurCents: 4,
};

describe('Create gas price', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('create_gas_price');

    jest.useFakeTimers().setSystemTime(new Date('2022-01-02'));
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
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
    test('responds 201 if the gas price has been created successfully', async () => {
      const res = await server.inject({
        headers,
        method: 'POST',
        payload: VALID_PAYLOAD,
        url: 'api/gas/price',
      });

      expect(res.statusCode).toEqual(201);
      const body: GasPrice = JSON.parse(res.body);

      expect(body).toMatchInlineSnapshot(`
        {
          "gasId": 1,
          "id": "1",
          "maxPressure": 200,
          "name": "1",
          "volume": 50,
        }
      `);

      const [{ ...dbSC }] = await knexController('storage_cylinder').where(
        'id',
        body.id
      );
      delete dbSC.created_at;
      delete dbSC.updated_at;
      expect(dbSC).toMatchInlineSnapshot(``);
    });

    test('responds 201 with undefined active_to parameter and manipulates existing gas price active time range', async () => {
      const res = await server.inject({
        headers,
        method: 'POST',
        payload: VALID_PAYLOAD_ACTIVE_TO_UNDEFINED,
        url: 'api/gas/price',
      });

      expect(res.statusCode).toEqual(201);
      const body: GasPrice = JSON.parse(res.body);

      expect(body).toMatchInlineSnapshot(``);

      const [{ ...dbSC }] = await knexController('storage_cylinder').where(
        'id',
        body.id
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
        url: 'api/gas/price',
      });

      expect(res.statusCode).toEqual(401);
    });

    test('responds 400 if required body property is missing', async () => {
      const res = await server.inject({
        headers,
        method: 'POST',
        payload: INVALID_PAYLOAD,
        url: 'api/gas/price',
      });

      expect(res.statusCode).toEqual(400);
      expect(JSON.parse(res.payload).message).toEqual(
        "body must have required property 'maxPressure'"
      );
    });

    test('responds 400 if it is not able to find gas with the given gasId', async () => {
      const res = await server.inject({
        headers,
        method: 'POST',
        payload: INVALID_PAYLOAD_NON_EXISTENT_GAS,
        url: 'api/gas/price',
      });

      expect(res.statusCode).toEqual(400);
      expect(JSON.parse(res.payload).message).toEqual('Gas does not exist');
    });
  });
});
