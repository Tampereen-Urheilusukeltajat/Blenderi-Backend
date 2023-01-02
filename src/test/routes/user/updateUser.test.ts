import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
} from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import { createTestDatabase, dropTestDatabase } from '../../../lib/testUtils';
import bcrypt from 'bcrypt';

const USER_UPDATE = {
  phone: '0010',
  forename: 'Edited',
  surname: 'Change',
  isAdmin: true,
  isBlender: false,
};

const CURRENT_PASSWORD = 'thisIsMyCurrentPassword';

describe('update user', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('update_user');

    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation((pw) => pw === CURRENT_PASSWORD);
  });

  afterAll(async () => {
    await dropTestDatabase();
    await knexController.destroy();
  });

  describe('Happy cases', () => {
    test('it returns user with updated values', async () => {
      const server = await getTestInstance();
      const id = '1be5abcd-53d4-11ed-9342-0242ac120002';
      const res = await server.inject({
        url: `api/user/${id}`,
        payload: USER_UPDATE,
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
      });

      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(200);
      expect(resBody).toMatchInlineSnapshot(`
        {
          "archivedAt": "",
          "email": "test@email.fi",
          "forename": "Edited",
          "id": "1be5abcd-53d4-11ed-9342-0242ac120002",
          "isAdmin": true,
          "isBlender": false,
          "phone": "0010",
          "surname": "Change",
        }
      `);
    });

    test('it returns 200 when updating values and passing current email & phone', async () => {
      const server = await getTestInstance();
      const id = '54e3e8b0-53d4-11ed-9342-0242ac120002';
      const res = await server.inject({
        url: `api/user/${id}/`,
        payload: {
          ...USER_UPDATE,
          email: 'testi2@email.fi',
          phone: '002',
          currentPassword: CURRENT_PASSWORD,
        },
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
      });

      const resBody = JSON.parse(res.body);
      expect(res.statusCode).toEqual(200);
      expect(resBody).toMatchInlineSnapshot(`
        {
          "archivedAt": "",
          "email": "testi2@email.fi",
          "forename": "Edited",
          "id": "54e3e8b0-53d4-11ed-9342-0242ac120002",
          "isAdmin": true,
          "isBlender": false,
          "phone": "002",
          "surname": "Change",
        }
      `);
    });

    test('it archives user', async () => {
      const server = await getTestInstance();
      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        payload: {
          archive: true,
        },
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
      });
      const resBody = JSON.parse(res.body);

      expect(res.statusCode).toEqual(200);
      expect(resBody.archivedAt).not.toEqual('');
    });

    test('it allows updating password and does not store plain text password to db', async () => {
      const server = await getTestInstance();

      const password = 'plainpassword';
      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        payload: { password, currentPassword: CURRENT_PASSWORD },
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
      });

      expect(res.statusCode).toEqual(200);

      const response = await knexController
        .select(['password_hash', 'salt'])
        .from('user');

      expect(response[0].password_hash).not.toEqual(password);
      expect(
        bcrypt.compareSync(password, response[0].password_hash)
      ).toBeTruthy();
    });
  });

  describe('Negative cases', () => {
    test('it returns 404 when no user with given id.', async () => {
      const server = await getTestInstance();

      const res = await server.inject({
        url: 'api/user/fbdfc65b-52ce-11ed-85ed-0242ac120069/',
        payload: {
          ...USER_UPDATE,
          email: 'random123@email.com',
          phone: '54323',
        },
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
      });

      expect(res.statusCode).toEqual(404);

      const resBody = JSON.parse(res.body);

      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 400 when invalid body parameter.', async () => {
      const server = await getTestInstance();

      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        // incorrect payload
        payload: { kakka: '1234' },
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
      });

      expect(res.statusCode).toEqual(400);

      const resBody = JSON.parse(res.body);

      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 400 when empty body.', async () => {
      const server = await getTestInstance();

      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        // incorrect payload
        payload: {},
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
      });

      expect(res.statusCode).toEqual(400);

      const resBody = JSON.parse(res.body);

      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 409 when email already in use.', async () => {
      const server = await getTestInstance();

      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        // incorrect payload type
        payload: {
          ...USER_UPDATE,
          email: 'alreadyin@use.fi',
          currentPassword: CURRENT_PASSWORD,
        },
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
      });

      expect(res.statusCode).toEqual(409);

      const resBody = JSON.parse(res.body);

      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 409 when phone already in use.', async () => {
      const server = await getTestInstance();

      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        // incorrect payload type
        payload: { ...USER_UPDATE, phone: '003' },
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
      });

      expect(res.statusCode).toEqual(409);

      const resBody = JSON.parse(res.body);

      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 404 when updating deleted user.', async () => {
      const server = await getTestInstance();

      const res = await server.inject({
        url: 'api/user/f1c605f5-6667-11ed-a6a4-0242ac120003/',
        payload: { forename: 'Deleted', surname: 'User' },
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
      });

      expect(res.statusCode).toEqual(404);

      const resBody = JSON.parse(res.body);

      expect(resBody).toHaveProperty('error');
      expect(resBody).toHaveProperty('message');
    });

    test('it returns 400 if user tries to update password without giving the current password', async () => {
      const server = await getTestInstance();

      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        payload: { password: 'wowlolhehhe' },
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
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
      const server = await getTestInstance();

      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        payload: { email: 'wowlolhehhe@robot.com' },
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
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
      const server = await getTestInstance();

      const res = await server.inject({
        url: 'api/user/1be5abcd-53d4-11ed-9342-0242ac120002/',
        payload: {
          email: 'wowlolhehhe@robot.com',
          password: 'wowlolhehhe',
          currentPassword: 'Moro :D',
        },
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
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
});
