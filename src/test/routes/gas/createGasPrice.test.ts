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
import {
  type CreateGasPriceBody,
  type GasWithPricing,
} from '../../../types/gas.types';
import { buildServer } from '../../../server';

const VALID_PAYLOAD: CreateGasPriceBody = {
  activeFrom: new Date('2022-01-01').toISOString(),
  activeTo: new Date('2022-12-31').toISOString(),
  gasId: '1',
  priceEurCents: 4,
};

const VALID_PAYLOAD_ACTIVE_TO_UNDEFINED: CreateGasPriceBody = {
  activeFrom: new Date('2023-02-01').toISOString(),
  activeTo: undefined,
  gasId: '2',
  priceEurCents: 7,
};

const INVALID_PAYLOAD: Partial<CreateGasPriceBody> = {
  activeFrom: undefined,
  gasId: '1',
};

const INVALID_PAYLOAD_NON_EXISTENT_GAS: CreateGasPriceBody = {
  activeFrom: new Date('2022-01-01').toISOString(),
  activeTo: new Date('2022-12-31').toISOString(),
  gasId: '42',
  priceEurCents: 4,
};

describe('Create gas price', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('create_gas_price');
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
        email: 'test-admin@email.fi',
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
      const body: GasWithPricing = JSON.parse(res.body);

      expect(body).toMatchInlineSnapshot(`
        {
          "activeFrom": "2022-00-06 00:00:00",
          "activeTo": "9999-12-31T23:59:59.000Z",
          "gasId": "1",
          "gasName": "Air",
          "gasPriceId": "6",
          "priceEurCents": 4,
        }
      `);

      const [{ ...dbGP }] = await knexController('gas_price').where(
        'id',
        body.gasPriceId,
      );
      delete dbGP.created_at;
      delete dbGP.updated_at;
      expect(dbGP).toMatchInlineSnapshot(`
        {
          "active_from": "2022-00-06 00:00:00",
          "active_to": 9999-12-31T23:59:59.000Z,
          "gas_id": 1,
          "id": 6,
          "price_eur_cents": 4,
        }
      `);
    });

    test('responds 201 with undefined active_to parameter and manipulates existing gas price active time range', async () => {
      const [{ ...dbBeforeUpdatePreviousGP }] = await knexController(
        'gas_price',
      ).where('id', '1');

      expect(dbBeforeUpdatePreviousGP.active_to).toMatchInlineSnapshot(
        `"2022-00-06 00:00:00"`,
      );

      const res = await server.inject({
        headers,
        method: 'POST',
        payload: VALID_PAYLOAD_ACTIVE_TO_UNDEFINED,
        url: 'api/gas/price',
      });

      expect(res.statusCode).toEqual(201);
      const body: GasWithPricing = JSON.parse(res.body);

      expect(body).toMatchInlineSnapshot(`
        {
          "activeFrom": "2023-01-03T00:00:00.000Z",
          "activeTo": "9999-12-31T23:59:59.000Z",
          "gasId": "2",
          "gasName": "Helium",
          "gasPriceId": "7",
          "priceEurCents": 7,
        }
      `);

      const [{ ...dbGP }] = await knexController('gas_price').where(
        'id',
        body.gasPriceId,
      );
      delete dbGP.created_at;
      delete dbGP.updated_at;
      expect(dbGP).toMatchInlineSnapshot(`
        {
          "active_from": 2023-01-03T00:00:00.000Z,
          "active_to": 9999-12-31T23:59:59.000Z,
          "gas_id": 2,
          "id": 7,
          "price_eur_cents": 7,
        }
      `);

      // Make sure it modified the existing gas price and set active_to correctly
      const [{ ...dbPreviousGP }] = await knexController('gas_price').where(
        'id',
        '1',
      );

      delete dbPreviousGP.created_at;
      delete dbPreviousGP.updated_at;
      delete dbPreviousGP.active_from;

      expect(dbPreviousGP).toMatchInlineSnapshot(`
        {
          "active_to": "2022-00-06 00:00:00",
          "gas_id": 1,
          "id": 1,
          "price_eur_cents": 0,
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

    test('responds 403 if user is not admin', async () => {
      const loginRes = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'test@email.fi',
          password: 'password',
        },
      });

      const tokens = JSON.parse(loginRes.body);
      headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };

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
        "body must have required property 'priceEurCents'",
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
