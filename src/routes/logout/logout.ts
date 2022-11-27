import { FastifyInstance, FastifyReply } from 'fastify';
import { log } from '../../lib/log';
import { errorHandler } from '../../lib/errorHandler';
import { invalidate, EXAMPLE_JWT } from '../../lib/jwtUtils';
import {
  logoutRequestBody,
  LogoutRequest,
  logoutResponseBody,
} from '../../types/auth.types';

const schema = {
  tags: ['Auth'],
  body: logoutRequestBody,
  response: {
    200: logoutResponseBody,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

schema.body.properties.refreshToken.example = EXAMPLE_JWT;
schema.response['200'].properties.message.example =
  'Refresh token invalidated.';
schema.response['200'].properties.id.example =
  '4a229272-6db4-11ed-aa8f-00155df36f2c';

const handler = async function (
  request: LogoutRequest,
  reply: FastifyReply
): Promise<void> {
  let refreshTokenDecoded;
  try {
    refreshTokenDecoded = this.jwt.verify(request.body.refreshToken);
  } catch (error) {
    if (error?.code === 'FAST_JWT_INVALID_SIGNATURE') {
      log.info('Received invalid refresh token.');
    }
    return errorHandler(reply, 401);
  }
  const userId = request.user['id'];
  const tokenId = refreshTokenDecoded.jwt as string;
  await invalidate(tokenId, userId);

  return reply.code(200).send({
    message: 'Refresh token invalidated.',
    id: userId,
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
