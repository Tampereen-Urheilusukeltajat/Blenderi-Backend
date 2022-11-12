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
  description:
    'Selects a diving cylinder set with given owner id if defined. Otherwise returns all sets.',
  tags: ['Cylinder set'],
  response: {
    200: Type.Array(cylinderSet),
    401: { $ref: 'error' },
    403: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{ Params: CylinderSetOwnerParamsPayload }>,
  reply: FastifyReply
): Promise<void> => {
  await knexController.transaction(async (trx) => {
    const resultBody: CylinderSet[] | undefined = await selectCylinderSets(trx);
    if (
      resultBody !== undefined &&
      request.params.cylinderSetOwner !== undefined
    ) {
      const result = resultBody.filter(
        (cylinder) => cylinder.owner === request.params.cylinderSetOwner
      );

      if (result.length === 0) {
        await errorHandler(reply, 404, 'Cylinder set not found');
        return;
      }

      await reply.code(200).send(result);
    }

    await reply.code(200).send(resultBody);
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/:cylinderSetOwner',
    handler,
    schema,
  });
  fastify.route({
    method: 'GET',
    url: '/',
    handler,
    schema,
  });
};
