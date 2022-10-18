import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuid } from 'uuid';

import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/errorHandler';
import selectCylinderSet from '../../lib/selectCylinderSet';
import {
  Cylinder,
  cylinderSet,
  CylinderSet,
  createCylinderSet,
  CreateCylinderSet,
} from '../../types/cylinderSet.types';

const schema = {
  description: 'Creates a diving cylinder set',
  tags: ['Cylinder set'],
  body: createCylinderSet,
  response: {
    201: cylinderSet,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    409: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Body: CreateCylinderSet;
  }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization

  // validate cylinder data
  for (const cylinder of request.body.cylinders) {
    // inspection date
    const inspection = new Date(cylinder.inspection);
    const thisYear = new Date().getUTCFullYear();
    if (inspection.getUTCFullYear() > thisYear) {
      return errorHandler(reply, 400, 'Inspection date from the future');
    }
  }

  await knexController
    .transaction(async (trx) => {
      const setId = uuid();

      await trx('diving_cylinder_set').insert({
        id: setId,
        name: request.body.name,
        owner: request.body.owner,
      });

      for (const cylinder of request.body.cylinders) {
        const cylinderId = uuid();
        const inspection = new Date(cylinder.inspection);

        await trx('diving_cylinder').insert<Cylinder>({
          id: cylinderId,
          volume: cylinder.volume,
          pressure: cylinder.pressure,
          material: cylinder.material,
          serial_number: cylinder.serialNumber,
          inspection: inspection.toISOString().slice(0, 23),
        });

        await trx('diving_cylinder_to_set').insert({
          cylinder: cylinderId,
          cylinder_set: setId,
        });
      }

      const resultBody: CylinderSet | undefined = await selectCylinderSet(
        trx,
        setId
      );
      if (resultBody === undefined) {
        throw new Error('Database insertion failed: new cylinder set');
      }

      await reply.code(201).send(resultBody);
    })
    .catch(async (error) => {
      if (error?.code === 'ER_DUP_ENTRY') {
        return errorHandler(
          reply,
          409,
          'Tried to create duplicate diving cylinder set'
        );
      }

      if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
        return errorHandler(reply, 400, 'User not found');
      }

      throw error;
    });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
