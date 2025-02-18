import { describe, expect, test } from '@jest/globals';
import { knexController } from '../../../database/database';
import { buildServer } from '../../../server';
import {
  createTestDatabase,
  dropTestDatabase,
  startRedisConnection,
  stopRedisConnection,
} from '../../../lib/utils/testUtils';

describe('Password can be changed', () => {
  const longTestTimeOut = 10000; // ms

  // @TODO: Fix this
  test.skip(
    'Password can be changed',
    async () => {
      const server = await buildServer({
        routePrefix: 'api',
      });

      await createTestDatabase('password_reset');
      await startRedisConnection();

      // @ts-expect-error: getMessage is injected to mock function
      sgMail.setMailWaiter();
      const resetRequestResponse = await server.inject({
        url: '/api/reset-password/reset-request',
        method: 'POST',
        payload: {
          email: 'e2e.user@example.com',
        },
      });

      expect(resetRequestResponse.statusCode).toEqual(202);

      // @ts-expect-error: getMessage is injected to mock function
      const requestMessage: string = await sgMail.getMessage();

      const indexOfTokenString = requestMessage.indexOf('?token=') + 7;
      const token = requestMessage.substring(
        indexOfTokenString,
        indexOfTokenString + 36,
      );

      const indexOfUserIdString = requestMessage.indexOf('&id=') + 4;
      const userId = requestMessage.substring(
        indexOfUserIdString,
        indexOfUserIdString + 36,
      );

      // Try to reset with invalid token and login with it
      const setPasswordResponseWithInvalidToken = await server.inject({
        url: '/api/reset-password/set-password',
        method: 'POST',
        payload: {
          token: '56387c3d-145c-44e6-a037-9541848bc757',
          userId,
          password: 'rockYou.csv',
        },
      });

      expect(setPasswordResponseWithInvalidToken.statusCode).toEqual(204);

      // Wait for possible unwanted password resetting to be done
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Login with old password => should be successful

      const validLoginWithOldPasswordResponse = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'e2e.user@example.com',
          password: 'password',
        },
      });

      expect(validLoginWithOldPasswordResponse.statusCode).toEqual(200);

      // Try to log in with password that has been tried to be set

      const invalidLoginWithInvalidlyChangedPassword = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'e2e.user@example.com',
          password: 'rockYou.csv',
        },
      });

      expect(invalidLoginWithInvalidlyChangedPassword.statusCode).toEqual(401);

      // @ts-expect-error: getMessage is injected to mock function
      sgMail.setMailWaiter();

      const setPasswordResponse = await server.inject({
        url: '/api/reset-password/set-password',
        method: 'POST',
        payload: {
          token,
          userId,
          password: 'rockYou.txt',
        },
      });

      expect(setPasswordResponse.statusCode).toEqual(204);

      // @ts-expect-error: getMessage is injected to mock function
      const setMessage: string = await sgMail.getMessage();
      expect(setMessage).toContain(
        'Sait tämän viestin, koska olet vaihtanut salasanasi Tampereen Urheilusukeltajien Täyttöpaikka-palveluun.',
      );

      const oldPasswordLoginResponse = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'e2e.user@example.com',
          password: 'password',
        },
      });

      expect(oldPasswordLoginResponse.statusCode).toEqual(401);

      const validLoginResponse = await server.inject({
        url: '/api/login',
        method: 'POST',
        payload: {
          email: 'e2e.user@example.com',
          password: 'rockYou.txt',
        },
      });

      expect(validLoginResponse.statusCode).toEqual(200);

      await dropTestDatabase();
      await knexController.destroy();
      await stopRedisConnection();
    },
    longTestTimeOut,
  );
});
