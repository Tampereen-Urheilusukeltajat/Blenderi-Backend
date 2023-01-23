import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { errorHandler } from '../../lib/utils/errorHandler';
import { Type } from '@sinclair/typebox';
import {
  cylinderSetIdParamsPayload,
  CylinderSetIdParamsPayload,
} from '../../types/divingCylinderSet.types';
import { deleteCylinderSet } from '../../lib/queries/divingCylinderSet';

const deleteSetReply = Type.Object({
  setID: Type.String({ format: 'uuid' }),
  message: Type.String(),
});

const schema = {
  description: 'Deletes a diving cylinder set',
  tags: ['Cylinder set'],
  params: cylinderSetIdParamsPayload,
  response: {
    200: deleteSetReply,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    404: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Params: CylinderSetIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization

  const setID = request.params.cylinderSetId;

  // Delete cylinder set.
  const res = await deleteCylinderSet(setID);

  if (res.status !== 200) {
    return errorHandler(reply, res.status, res.message);
  }

  await reply.code(res.status).send({ setID, message: res.message });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'DELETE',
    url: '/:cylinderSetId',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
