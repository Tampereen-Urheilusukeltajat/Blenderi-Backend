import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { Type } from '@sinclair/typebox';

import {
  CylinderSet,
  cylinderSet,
  cylinderSetOwnerParamsPayload,
  CylinderSetOwnerParamsPayload,
} from '../../types/cylinderSet.types';
import selectCylinderSets from '../../lib/selectCylinderSets';

const schema = {
  description: 'Selects all diving cylinder sets.',
  tags: ['Cylinder set'],
  response: {
    200: Type.Array(cylinderSet),
    401: { $ref: 'error' },
    403: { $ref: 'error' },
  },
};

const schemaSetOwner = {
  description: 'Selects a diving cylinder set by given owner.',
  tags: ['Cylinder set'],
  params: cylinderSetOwnerParamsPayload,
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
    const allSets: CylinderSet[] | undefined = await selectCylinderSets(trx);
    if (
      allSets !== undefined &&
      request.params.cylinderSetOwner !== undefined
    ) {
      const userSet = allSets.filter(
        (cylinder) => cylinder.owner === request.params.cylinderSetOwner
      );

      await reply.code(200).send(userSet);
    }

    await reply.code(200).send(allSets);
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
  fastify.route({
    method: 'GET',
    url: '/:cylinderSetOwner',
    preValidation: [fastify['authenticate']],
    handler,
    schema: schemaSetOwner,
  });
};
