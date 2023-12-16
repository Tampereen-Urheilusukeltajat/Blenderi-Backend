import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { FastifyInstance } from 'fastify';
import {
  createTestDatabase,
  dropTestDatabase,
  startRedisConnection,
  stopRedisConnection,
} from '../../../lib/utils/testUtils';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import {
  CreateCompressorRequestBody,
  Compressor,
} from '../../../types/compressor.types';

const VALID_PAYLOAD: CreateCompressorRequestBody = {
  name: 'Iso kompura',
  description: 'Maijalan iso kompura, se punainen',
};

describe('Create compressor', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('create_compressor');
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
        email: 'admin@XD.fi',
        password: 'password',
      },
    });
    const tokens = JSON.parse(res.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
  });

  describe('Happy path', () => {
    test('responds 201 if the compressor has been created successfully', async () => {
      const res = await server.inject({
        headers,
        method: 'POST',
        payload: VALID_PAYLOAD,
        url: 'api/compressor',
      });

      expect(res.statusCode).toEqual(201);
      const body: Compressor = JSON.parse(res.body);

      expect(body.name).toEqual(VALID_PAYLOAD.name);
      expect(body.description).toEqual(VALID_PAYLOAD.description);
      expect(body.isEnabled).toEqual(true);
    });
  });

  describe('Unhappy path', () => {
    test('responds 401 if authentication header was not provided', async () => {
      const res = await server.inject({
        method: 'POST',
        payload: VALID_PAYLOAD,
        url: 'api/compressor',
      });

      expect(res.statusCode).toEqual(401);
    });

    test('responds 400 if required body property is missing', async () => {
      const res = await server.inject({
        headers,
        method: 'POST',
        payload: { name: 'compressor name' },
        url: 'api/compressor',
      });

      expect(res.statusCode).toEqual(400);
      expect(JSON.parse(res.payload).message).toEqual(
        "body must have required property 'description'"
      );
    });

    test('responds 400 for too long name', async () => {
      const res = await server.inject({
        headers,
        method: 'POST',
        payload: {
          name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          description: 'describes things',
        },
        url: 'api/compressor',
      });

      expect(res.statusCode).toEqual(400);
      expect(JSON.parse(res.payload).message).toEqual(
        'body/name must NOT have more than 32 characters'
      );
    });
  });
});
