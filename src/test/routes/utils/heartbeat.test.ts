/* eslint-disable @typescript-eslint/no-misused-promises */
import { describe, test, expect } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { HeartbeatResponse } from '../../../routes/utils/heartbeat';
import { buildServer } from '../../../server';

describe('heartbeat', () => {
  const getTestIntance = async (): Promise<FastifyInstance> => buildServer({
    routePrefix: 'api'
  });

  test('it returns status OK and the current date', async () => {
    const server = await getTestIntance();

    const res = await server.inject({
      url: 'api/utils/heartbeat'
    });

    expect(res.statusCode).toEqual(200);

    const resBody = JSON.parse(res.body) as HeartbeatResponse;
    expect(resBody).toHaveProperty('status');
    expect(resBody).toHaveProperty('date');
    expect(resBody.status).toEqual('OK');
  });
});
