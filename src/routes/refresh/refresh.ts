import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { errorHandler } from '../../lib/errorHandler';
import { v4 as uuid } from 'uuid';
import { tokenIsUsable, rotate } from '../../lib/refreshTokenUtils';

const refreshTokenExpireTime = 8640000; // 100 days
const accessTokenExpireTime = 100;

const schema = {
  description: 'refresh',
  tags: ['Auth'],
  body: {
    type: 'object',
    properties: {
      refreshToken: {
        type: 'string',
        example:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3YThjMWM2LTVlZDYtMTFlZC1iNmYxLTAyNDJhYzEyMDAwNCIsImp0aSI6IjMxZjc3NjBmLWUwNmMtNDUwZi1iYWVjLWU2ZTY4YzkwYTkwZCIsImlhdCI6MTY2NzkzOTE3MiwiZXhwIjoxNjc2NTc5MTcyfQ.hDi1sadn1QC_UUdifNKu70p9MMrVxRGZx2jsLd7V04c',
      },
    },
    required: ['refreshToken'],
  },
  response: {
    200: {
      description: 'Refreshed',
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
    400: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async function (
  request: FastifyRequest<{
    Body: {
      refreshToken: 'string';
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  const oldRefreshTokenDecoded = this.jwt.verify(request.body.refreshToken);
  const userId: string = oldRefreshTokenDecoded.id;
  const oldJti: string = oldRefreshTokenDecoded.jti;

  if (!(await tokenIsUsable(request.body.refreshToken, userId, oldJti))) {
    return errorHandler(reply, 403);
  }

  const jti: string = uuid();
  const refreshToken = this.jwt.sign(
    { id: userId },
    { expiresIn: refreshTokenExpireTime, jti }
  );
  const accessToken: string = this.jwt.sign(
    { id: userId },
    { expiresIn: accessTokenExpireTime }
  );

  await rotate(oldJti, jti, userId, refreshToken, refreshTokenExpireTime);

  return reply.code(200).send({ accessToken, refreshToken });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
