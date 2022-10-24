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

describe('Get user', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('get_user');
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
  });

  let server;
  beforeEach(async () => {
    server = await getTestInstance();
  });
  describe('User is found', () => {
    test('it returns 200 and has right properties', async () => {
      const res = await server.inject({
        url: '/api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        method: 'GET',
      });
      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(200);
      expect(resBody).toHaveProperty('id');
      expect(resBody).toHaveProperty('email');
      expect(resBody).toHaveProperty('forename');
      expect(resBody).toHaveProperty('surname');
      expect(resBody).toHaveProperty('isAdmin');
      expect(resBody).toHaveProperty('isBlender');
      expect(resBody).toHaveProperty('archivedAt');
      expect(resBody).not.toHaveProperty('deletedAt');
      expect(resBody).not.toHaveProperty('passwordHash');
      expect(resBody).not.toHaveProperty('salt');
      expect(resBody).not.toHaveProperty('deleted_at');
      expect(resBody).not.toHaveProperty('created_at');
      expect(resBody).not.toHaveProperty('updated_at');
    });
  });
  describe('User cant be returned', () => {
    test('it returns 404 if user is not found', async () => {
      const res = await server.inject({
        url: '/api/user/notfound/',
        method: 'GET',
      });
      expect(res.statusCode).toEqual(404);
      const resBody = JSON.parse(res.body);
      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 404 if user is archived', async () => {
      const res = await server.inject({
        url: '/api/user/archivedUser/',
        method: 'GET',
      });
      expect(res.statusCode).toEqual(404);
      const resBody = JSON.parse(res.body);
      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 404 if user is deleted', async () => {
      const res = await server.inject({
        url: '/api/user/deletedUser/',
        method: 'GET',
      });
      expect(res.statusCode).toEqual(404);
      const resBody = JSON.parse(res.body);
      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });
  });
});
