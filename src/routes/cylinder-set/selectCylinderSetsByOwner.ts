import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { Type } from '@sinclair/typebox';

import {
  CylinderSet,
  cylinderSet,
  CylinderSetOwnerParamsPayload,
} from '../../types/cylinderSet.types';
import selectCylinderSets from '../../lib/selectCylinderSets';
import { errorHandler } from '../../lib/errorHandler';

const schema = {
  description: 'Selects diving cylinder sets with given owner',
  tags: ['Cylinder set'],
  response: {
    200: Type.Array(cylinderSet),
    401: { $ref: 'error' },
    403: { $ref: 'error' },
  },
};

const handler = async (
  req: FastifyRequest<{
    Params: CylinderSetOwnerParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  await knexController.transaction(async (trx) => {
    const resultBody: CylinderSet[] | undefined = await selectCylinderSets(trx);
    if (resultBody !== undefined) {
      const result = resultBody.filter(
        (cylinder) => cylinder.owner === req.params.cylinderSetOwner
      );

      if (result.length > 0) {
        await reply.code(200).send(result);
      } else {
        await errorHandler(reply, 404, 'Cylinder set not found');
      }
    }
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/owner/:cylinderSetOwner',
    handler,
    schema,
  });
};
