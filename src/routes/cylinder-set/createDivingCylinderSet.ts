import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/utils/errorHandler';
import { selectCylinderSet } from '../../lib/queries/divingCylinderSet';
import {
  CreateDivingCylinderSet,
  createDivingCylinderSet,
  DivingCylinder,
  DivingCylinderSet,
  divingCylinderSet,
} from '../../types/divingCylinderSet.types';

const schema = {
  description: 'Creates a diving cylinder set',
  tags: ['Cylinder set'],
  body: createDivingCylinderSet,
  response: {
    201: divingCylinderSet,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    409: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Body: CreateDivingCylinderSet;
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
      await errorHandler(reply, 400, 'Inspection date from the future');
      return;
    }
  }

  await knexController
    .transaction(async (trx) => {
      const setId = randomUUID();

      await trx('diving_cylinder_set').insert({
        id: setId,
        name: request.body.name,
        owner: request.body.owner,
      });

      for (const cylinder of request.body.cylinders) {
        const cylinderId = randomUUID();
        const inspection = new Date(cylinder.inspection);

        await trx('diving_cylinder').insert<DivingCylinder>({
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

      const resultBody: DivingCylinderSet | undefined = await selectCylinderSet(
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
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
