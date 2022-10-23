import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { Type } from '@sinclair/typebox';

import {
  CylinderSet,
  cylinderSet,
  CylinderSetOwnerParamsPayload,
} from '../../types/cylinderSet.types';
import selectCylinderSets from '../../lib/selectCylinderSets';

const schema = {
  description: 'Selects a diving cylinder set with given id',
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
    if (resultBody === undefined) {
      throw new Error('Database select failed: select all cylinder set');
    }

    await reply
      .code(200)
      .send(
        resultBody.filter(
          (cylinder) => cylinder.owner === req.params.cylinderSetOwner
        )
      );
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
