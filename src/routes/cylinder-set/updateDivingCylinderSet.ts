import {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/utils/errorHandler';
import {
  divingCylinderSetExists,
  selectCylinderSet,
} from '../../lib/queries/divingCylinderSet';
import {
  type DivingCylinderSet,
  divingCylinderSet,
  divingCylinderSetIdParamsPayload,
  type DivingCylinderSetIdParamsPayload,
  type UpdateDivingCylinderBody,
  updateDivingCylinderSet,
  type UpdateDivingCylinderSet,
} from '../../types/divingCylinderSet.types';
import { log } from '../../lib/utils/log';

const schema = {
  description: 'Updates a diving cylinder set',
  tags: ['Cylinder set'],
  body: updateDivingCylinderSet,
  params: divingCylinderSetIdParamsPayload,
  response: {
    200: divingCylinderSet,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    404: { $ref: 'error' },
    409: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Body: UpdateDivingCylinderSet;
    Params: DivingCylinderSetIdParamsPayload;
  }>,
  reply: FastifyReply,
): Promise<void> => {
  const { id: userId } = request.user;

  const setId = request.params.divingCylinderSetId;

  // validate cylinder data
  if (request.body.cylinders !== undefined) {
    for (const cylinder of request.body.cylinders) {
      // inspection date
      if (cylinder.inspection !== undefined) {
        const inspection = new Date(cylinder.inspection);
        const thisYear = new Date().getUTCFullYear();
        if (inspection.getUTCFullYear() > thisYear) {
          await errorHandler(reply, 400, 'Inspection date from the future');
          return;
        }
      }
    }
  }

  // Check that the cylinder set exists and that it belongs to the user
  const dcsExists = await divingCylinderSetExists(setId, userId);
  if (!dcsExists) {
    return errorHandler(reply, 404);
  }

  await knexController
    .transaction(async (trx) => {
      const updateResult = await trx('diving_cylinder_set')
        .where('id', setId)
        .update<UpdateDivingCylinderSet>({
          name: request.body.name,
          updated_at: trx.fn.now(),
        });

      if (!updateResult) {
        log.error(
          `Tried to update nonexisting diving cylinder set even though it should exist. Id: ${setId}`,
        );
        return errorHandler(reply, 500);
      }

      if (request.body.cylinders !== undefined) {
        for (const cylinder of request.body.cylinders) {
          let inspection: string | undefined;
          if (cylinder.inspection !== undefined) {
            const inspectionDate = new Date(cylinder.inspection);
            inspection = inspectionDate.toISOString().slice(0, 23);
          }

          await trx('diving_cylinder')
            .where('id', cylinder.id)
            .update<UpdateDivingCylinderBody>({
              volume: cylinder.volume,
              pressure: cylinder.pressure,
              material: cylinder.material,
              serial_number: cylinder.serialNumber,
              inspection,
            });
        }
      }

      const resultBody: DivingCylinderSet | undefined = await selectCylinderSet(
        trx,
        setId,
      );
      if (resultBody === undefined) {
        throw new Error('Database update failed: update cylinder set');
      }

      await reply.code(200).send(resultBody);
    })
    .catch(async (error) => {
      if (error?.code === 'ER_DUP_ENTRY') {
        return errorHandler(
          reply,
          409,
          'Tried to create duplicate diving cylinder set',
        );
      }

      throw error;
    });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'PATCH',
    url: '/:divingCylinderSetId',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
