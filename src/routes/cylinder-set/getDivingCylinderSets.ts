import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type } from '@sinclair/typebox';

import { getUsersDivingCylinderSets } from '../../lib/queries/divingCylinderSet';
import { errorHandler } from '../../lib/utils/errorHandler';
import { UserIdQueryString, userIdQueryString } from '../../types/user.types';
import { divingCylinderSet } from '../../types/divingCylinderSet.types';

const schema = {
  description: 'Selects a diving cylinder set by given owner.',
  tags: ['Cylinder set'],
  query: userIdQueryString,
  response: {
    200: Type.Array(divingCylinderSet),
    401: { $ref: 'error' },
    403: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{ Querystring: UserIdQueryString }>,
  reply: FastifyReply
): Promise<void> => {
  const { userId } = request.query;

  // Only admins can read other users cylinders
  if (userId !== request.user.id && !request.user.isAdmin)
    return errorHandler(reply, 403);

  const divingCylinderSets = await getUsersDivingCylinderSets(userId);
  return reply.send(divingCylinderSets);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
