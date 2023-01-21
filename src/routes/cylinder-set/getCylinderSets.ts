import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type } from '@sinclair/typebox';

import {
  cylinderSet,
  cylinderSetOwnerParamsPayload,
  CylinderSetOwnerParamsPayload,
} from '../../types/cylinderSet.types';

const schema = {
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
  // TODO TO BE REFACTORED
  // await knexController.transaction(async (trx) => {
  //   const allSets: CylinderSet[] | undefined = await selectCylinderSets(trx);
  //   if (
  //     allSets !== undefined &&
  //     request.params.cylinderSetOwner !== undefined
  //   ) {
  //     const userSet = allSets.filter(
  //       (cylinder) => cylinder.owner === request.params.cylinderSetOwner
  //     );
  //     await reply.code(200).send(userSet);
  //   }
  // });
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
