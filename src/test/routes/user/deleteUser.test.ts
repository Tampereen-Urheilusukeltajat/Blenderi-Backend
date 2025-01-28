/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { type FastifyInstance } from 'fastify';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import {
  createTestDatabase,
  dropTestDatabase,
  startRedisConnection,
  stopRedisConnection,
} from '../../../lib/utils/testUtils';

describe('Delete user', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('delete_user');
    await startRedisConnection();
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
    await stopRedisConnection();
  });

  let server;
  beforeEach(async () => {
    server = await getTestInstance();
  });

  /**
   * @TODO Change tests so that they are independent from each other and can
   * be run alone
   */
  describe.skip('successful', () => {
    const delUserId = '1be5abcd-53d4-11ed-9342-0242ac120002';

    test('it returns 200 when successful', async () => {
      const login = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'admin@admin.com',
          password: 'salasana',
        },
      });
      const tokens = JSON.parse(login.body);
      const headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };

      const res = await server.inject({
        url: `api/user/${delUserId}`,
        method: 'DELETE',
        headers,
      });
      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(200);
      expect(resBody.userId).toMatch(delUserId);
      expect(resBody.deletedAt).not.toBeNull();
    });

    test('it anonymizes user data', async () => {
      const res = await knexController('user')
        .where({ id: delUserId })
        .first(
          'email',
          'forename',
          'surname',
          'phone_number',
          'deleted_at as deletedAt',
        );
      expect(res.email).toBeNull();
      expect(res.forename).toBeNull();
      expect(res.surname).toBeNull();
      expect(res.phone_number).toBeNull();
      expect(res.deletedAt).not.toBeNull();
    });

    test('it archives cylinder sets', async () => {
      const res = await knexController('diving_cylinder_set')
        .where({ owner: delUserId })
        .select('id', 'archived');
      expect(res).toMatchInlineSnapshot(`
        [
          RowDataPacket {
            "archived": 1,
            "id": "a4e1035e-f36e-4056-9a1b-5925a3c5793e",
          },
          RowDataPacket {
            "archived": 1,
            "id": "b4e1035e-f36e-4056-9a1b-5925a3c5793e",
          },
          RowDataPacket {
            "archived": 1,
            "id": "f4e1035e-f36e-4056-9a1b-5925a3c5793e",
          },
        ]
      `);
    });
  });

  describe('not successful', () => {
    test('it returns 404 when user is not found', async () => {
      const login = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'user@taursu.fi',
          password: 'salasana',
        },
      });
      const tokens = JSON.parse(login.body);
      const headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };

      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120069',
        method: 'DELETE',
        headers,
      });
      expect(res.statusCode).toEqual(404);
    });
  });
});
