import {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import { randomUUID } from 'crypto';
import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/utils/errorHandler';
import { getDivingCylinderSetById } from '../../lib/queries/divingCylinderSet';
import {
  type CreateDivingCylinderSet,
  createDivingCylinderSet,
  type DivingCylinder,
  type DivingCylinderSet,
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
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Body: CreateDivingCylinderSet;
  }>,
  reply: FastifyReply,
): Promise<void> => {
  const { body } = request;

  // validate cylinder data
  const thisYear = new Date().getUTCFullYear();
  for (const cylinder of body.cylinders) {
    // inspection date
    const inspection = new Date(cylinder.inspection);
    if (inspection.getUTCFullYear() > thisYear) {
      return errorHandler(reply, 400, 'Inspection date from the future');
    }
  }

  await knexController
    .transaction(async (trx) => {
      const setId = randomUUID();

      await trx('diving_cylinder_set').insert({
        id: setId,
        name: body.name,
        owner: body.owner,
        diving_club_owner_id: body.divingClubOwnerId,
      });

      for (const cylinder of body.cylinders) {
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

      const resultBody: DivingCylinderSet | undefined =
        await getDivingCylinderSetById(setId, trx);
      if (resultBody === undefined) {
        throw new Error('Database insertion failed: new cylinder set');
      }

      await reply.code(201).send(resultBody);
    })
    .catch(async (error) => {
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
