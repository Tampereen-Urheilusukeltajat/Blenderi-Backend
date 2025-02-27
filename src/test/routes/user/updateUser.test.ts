/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
// import { type FastifyInstance } from 'fastify';
import { knexController } from '../../../database/database';
// import { buildServer } from '../../../server';
import {
  createTestDatabase,
  dropTestDatabase,
  startRedisConnection,
  stopRedisConnection,
} from '../../../lib/utils/testUtils';
import bcrypt from 'bcrypt';
import { type FastifyInstance } from 'fastify';
import { buildServer } from '../../../server';

const USER_UPDATE = {
  phoneNumber: '00010',
  forename: 'Edited',
  surname: 'Change',
};

const CURRENT_PASSWORD = 'thisIsMyCurrentPassword';

describe('update user', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('update_user');
    await startRedisConnection();

    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation((pw) => pw === CURRENT_PASSWORD);
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
    await stopRedisConnection();
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
        password: CURRENT_PASSWORD,
      },
    });
    const tokens = JSON.parse(res.body);
    headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };
  });

  describe('Happy cases', () => {
    test('it returns user with updated values', async () => {
      const id = '1be5abcd-53d4-11ed-9342-0242ac120002';
      const res = await server.inject({
        url: `api/user/${id}`,
        payload: USER_UPDATE,
        method: 'PATCH',
        headers,
      });

      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(200);
      expect(resBody).toMatchInlineSnapshot(`
        {
          "email": "test@email.fi",
          "forename": "Edited",
          "id": "1be5abcd-53d4-11ed-9342-0242ac120002",
          "isAdmin": false,
          "isAdvancedBlender": false,
          "isBlender": true,
          "isInstructor": false,
          "isUser": true,
          "phoneNumber": "00010",
          "surname": "Change",
        }
      `);
    });

    test('it returns 200 when updating values and passing current email & phone', async () => {
      const logRes = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'testi2@email.fi',
          password: CURRENT_PASSWORD,
        },
      });
      const tokens = JSON.parse(logRes.body);
      headers = { Authorization: 'Bearer ' + String(tokens.accessToken) };

      const id = '54e3e8b0-53d4-11ed-9342-0242ac120002';
      const res = await server.inject({
        url: `api/user/${id}/`,
        payload: {
          ...USER_UPDATE,
          email: 'testi2@email.fi',
          phoneNumber: '00002',
          currentPassword: CURRENT_PASSWORD,
        },
        method: 'PATCH',
        headers,
      });

      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(200);
      expect(resBody).toMatchInlineSnapshot(`
        {
          "email": "testi2@email.fi",
          "forename": "Edited",
          "id": "54e3e8b0-53d4-11ed-9342-0242ac120002",
          "isAdmin": false,
          "isAdvancedBlender": false,
          "isBlender": true,
          "isInstructor": false,
          "isUser": true,
          "phoneNumber": "00002",
          "surname": "Change",
        }
      `);
    });

    test('it allows updating password and does not store plain text password to db', async () => {
      const password = 'plainpassword';
      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        payload: { password, currentPassword: CURRENT_PASSWORD },
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(200);

      const response = await knexController
        .select(['password_hash', 'salt'])
        .from('user');

      expect(response[0].password_hash).not.toEqual(password);
      expect(
        bcrypt.compareSync(password, response[0].password_hash),
      ).toBeTruthy();
    });
  });

  describe('Negative cases', () => {
    test('it returns 400 when invalid body parameter.', async () => {
      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        // incorrect payload
        payload: { kakka: '1234' },
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(400);

      const resBody = JSON.parse(res.body);

      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 400 when empty body.', async () => {
      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        // incorrect payload
        payload: {},
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(400);

      const resBody = JSON.parse(res.body);

      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 409 when email already in use.', async () => {
      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        // incorrect payload type
        payload: {
          ...USER_UPDATE,
          email: 'alreadyin@use.fi',
          currentPassword: CURRENT_PASSWORD,
        },
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(409);

      const resBody = JSON.parse(res.body);

      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 409 when phone already in use.', async () => {
      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        // incorrect payload type
        payload: { ...USER_UPDATE, phoneNumber: '00002' },
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(409);

      const resBody = JSON.parse(res.body);

      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 400 if user tries to update password without giving the current password', async () => {
      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        payload: { password: 'wowlolhehhe' },
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(400);
      expect(JSON.parse(res.body)).toMatchInlineSnapshot(`
        {
          "error": "Bad Request",
          "message": "Current password is required",
          "statusCode": 400,
        }
      `);
    });

    test('it returns 400 if user tries to update email without giving the current password', async () => {
      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        payload: { email: 'wowlolhehhe@robot.com' },
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(400);
      expect(JSON.parse(res.body)).toMatchInlineSnapshot(`
        {
          "error": "Bad Request",
          "message": "Current password is required",
          "statusCode": 400,
        }
      `);
    });

    test('it returns 400 if user gives wrong current password', async () => {
      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        payload: {
          email: 'wowlolhehhe@robot.com',
          password: 'wowlolhehhe',
          currentPassword: 'Moro :D',
        },
        method: 'PATCH',
        headers,
      });

      expect(res.statusCode).toEqual(400);
      expect(JSON.parse(res.body)).toMatchInlineSnapshot(`
        {
          "error": "Bad Request",
          "message": "Invalid current password",
          "statusCode": 400,
        }
      `);
    });
  });

  describe('last test case which breaks everything please fix', () => {
    test('it archives user', async () => {
      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002',
        payload: {
          archive: true,
        },
        method: 'PATCH',
        headers,
      });
      const resBody = JSON.parse(res.body);

      expect(res.statusCode).toEqual(200);
      expect(resBody.archivedAt).not.toEqual('');
    });
  });
});
