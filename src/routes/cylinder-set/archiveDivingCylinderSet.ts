import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  DivingCylinderSetIdParamsPayload,
  divingCylinderSetIdParamsPayload,
} from '../../types/divingCylinderSet.types';
import {
  archiveDivingCylinderSet,
  divingCylinderSetExists,
} from '../../lib/queries/divingCylinderSet';
import { errorHandler } from '../../lib/utils/errorHandler';

const archiveDivingCylinderSetReply = Type.Object({
  divingCylinderSetId: Type.String({ format: 'uuid' }),
});

const schema = {
  description: 'Archives aka deletes a diving cylinder set',
  tags: ['Cylinder set'],
  params: divingCylinderSetIdParamsPayload,
  response: {
    200: archiveDivingCylinderSetReply,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    404: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Params: DivingCylinderSetIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const { divingCylinderSetId } = request.params;
  const { user } = request;

  const dcSetExists = await divingCylinderSetExists(
    divingCylinderSetId,
    user.id
  );
  if (!dcSetExists) return errorHandler(reply, 404);

  // Archive cylinder set
  await archiveDivingCylinderSet(divingCylinderSetId);

  return reply.send({
    divingCylinderSetId,
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'PATCH',
    url: '/:divingCylinderSetId/archive',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
