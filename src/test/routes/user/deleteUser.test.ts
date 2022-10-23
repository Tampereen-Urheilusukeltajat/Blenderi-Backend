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

describe('Delete user', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('delete_user');
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
  });

  let server;
  beforeEach(async () => {
    server = await getTestInstance();
  });

  describe('successful', () => {
    test('it returns 200 when successful', async () => {
      const res = await server.inject({
        url: 'api/user/1',
        method: 'DELETE',
      });
      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(200);
      expect(resBody.deletedAt).not.toBeNull();
    });

    test('it anonymizes user data', async () => {
      const res = await knexController('user')
        .where({ id: 1 })
        .first(
          'email',
          'forename',
          'surname',
          'is_admin as isAdmin',
          'is_blender as isBlender',
          'deleted_at as deletedAt'
        );
      expect(res.email).toBeNull();
      expect(res.forename).toBeNull();
      expect(res.surname).toBeNull();
      expect(res.isAdmin).toEqual(0);
      expect(res.isBlender).toEqual(0);
      expect(res.deletedAt).not.toBeNull();
    });
  });

  describe('not successful', () => {
    test('it returns 404 when user is not found', async () => {
      const res = await server.inject({
        url: 'api/user/notfound',
        method: 'DELETE',
      });
      expect(res.statusCode).toEqual(404);
    });
  });
});
