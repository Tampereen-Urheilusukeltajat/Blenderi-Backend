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
import { validateTurnstileToken } from '../../../lib/auth/turnstile';

describe('Password reset request', () => {
  const getTestInstance = async (): Promise<FastifyInstance> =>
    buildServer({
      routePrefix: 'api',
    });

  beforeAll(async () => {
    await createTestDatabase('password_reset');
    await startRedisConnection();
    // @ts-expect-error One word: perkele
    validateTurnstileToken.mockResolvedValue(true);
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

  test('It returns 202 for existing user', async () => {
    const res = await server.inject({
      url: '/api/reset-password/reset-request',
      method: 'POST',
      payload: {
        email: 'user@example.com',
        turnstileToken:
          '0H9sCE19DLgiaIBqjC6qTzYQb89Gk06cp60oX6j7K8YCr7mGCo0ddgZOj4J6G225BCjr2CZxfHeC082VUrdJ4fhfdMwfL3aLerRcdmQDuH8ypXeincJa5xWFjdHacljsXbZBUZGMcynpEcPmhtUsNYx7JMXLoyrSV0bYwnAfEUrhqC9NHbaLchQYbQXDrhGmD09ujj0tMARCnEZ0lOmgtHez6WYE9JG1QkJYnRj9CxrPqXItNxkv5uUl7Qel64pvZIW6KhaHjma13IaV5C3sZ5tBHRJRXVOSIpg0Sir1VAE9yNQsF0SJMwB9unOlC6t3Jt1oHy1vBMIjhaMNN1vr0fMsgOih007Ftwa7GZhJK4r69suj1zddggA78tTTE9daEZMeh15yGICPZHBukkJF79gmaiJcf1pQli2eqi8dd20RzZuXQOzhRkYbPTKx2RuWOmd1EXnTjYG6YL7fbIwHxyupNzIq5HNwF5oo4grNkv4XObTgmgfNdGPa79NaidIBPuzNH',
      },
    });

    expect(res.statusCode).toEqual(202);
  });

  test('It returns 202 for nonexistent user', async () => {
    const res = await server.inject({
      url: '/api/reset-password/reset-request',
      method: 'POST',
      payload: {
        email: 'nonexistent.user@example.com',
        turnstileToken:
          '0H9sCE19DLgiaIBqjC6qTzYQb89Gk06cp60oX6j7K8YCr7mGCo0ddgZOj4J6G225BCjr2CZxfHeC082VUrdJ4fhfdMwfL3aLerRcdmQDuH8ypXeincJa5xWFjdHacljsXbZBUZGMcynpEcPmhtUsNYx7JMXLoyrSV0bYwnAfEUrhqC9NHbaLchQYbQXDrhGmD09ujj0tMARCnEZ0lOmgtHez6WYE9JG1QkJYnRj9CxrPqXItNxkv5uUl7Qel64pvZIW6KhaHjma13IaV5C3sZ5tBHRJRXVOSIpg0Sir1VAE9yNQsF0SJMwB9unOlC6t3Jt1oHy1vBMIjhaMNN1vr0fMsgOih007Ftwa7GZhJK4r69suj1zddggA78tTTE9daEZMeh15yGICPZHBukkJF79gmaiJcf1pQli2eqi8dd20RzZuXQOzhRkYbPTKx2RuWOmd1EXnTjYG6YL7fbIwHxyupNzIq5HNwF5oo4grNkv4XObTgmgfNdGPa79NaidIBPuzNH',
      },
    });

    expect(res.statusCode).toEqual(202);
  });
});
