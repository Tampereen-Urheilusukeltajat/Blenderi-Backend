import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import { createTestDatabase, dropTestDatabase } from '../../../lib/testUtils';

describe('Get users', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('get_users');
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
  });

  let server;
  beforeEach(async () => {
    server = await getTestInstance();
  });

  test('it returns all not archived users', async () => {
    const res = await server.inject({
      url: '/api/user/',
      method: 'GET',
    });
    const users = await knexController('user')
      .where({ archived_at: null })
      .select('id');
    const resBody = JSON.parse(res.body);
    expect(res.statusCode).toEqual(200);
    expect(resBody).toHaveLength(users.length);
  });

  test('it returns all users', async () => {
    const res = await server.inject({
      url: '/api/user?includeArchived=true',
      method: 'GET',
    });
    const users = await knexController('user').select('id');
    const resBody = JSON.parse(res.body);
    expect(res.statusCode).toEqual(200);
    expect(resBody).toHaveLength(users.length);
  });
});
