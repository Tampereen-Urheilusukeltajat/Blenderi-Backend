import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/errorHandler';
import selectCylinderSet from '../../lib/selectCylinderSet';

import {
  cylinderSetIdParamsPayload,
  CylinderSetIdParamsPayload,
  CylinderSet,
  cylinderSet,
} from '../../types/cylinderSet.types';

const schema = {
  description: 'Selects a diving cylinder set with given id',
  tags: ['Cylinder set'],
  params: cylinderSetIdParamsPayload,
  response: {
    200: cylinderSet,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    404: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Params: CylinderSetIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const setId = request.params.cylinderSetId;

  await knexController.transaction(async (trx) => {
    const selectResult = await trx('diving_cylinder_set')
      .where('id', setId)
      .select()
      .first();
    if (selectResult === 0) {
      await errorHandler(reply, 404, 'Cylinder set not found');
      return;
    }

    const resultBody: CylinderSet | undefined = await selectCylinderSet(
      trx,
      setId
    );
    if (resultBody === undefined) {
      throw new Error('Database select failed: select cylinder set');
    }

    await reply.code(200).send(resultBody);
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/:cylinderSetId',
    handler,
    schema,
  });
};
