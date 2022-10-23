import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/errorHandler';
import { Type } from '@sinclair/typebox';
import {
  Cylinder,
  cylinderSetIdParamsPayload,
  CylinderSetIdParamsPayload,
} from '../../types/cylinderSet.types';

const deleteSetReply = Type.Object({
  setID: Type.String(),
  message: Type.String(),
});

const schema = {
  description: 'Deletes a diving cylinder set',
  tags: ['Cylinder set'],
  params: cylinderSetIdParamsPayload,
  response: {
    200: deleteSetReply,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    404: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Params: CylinderSetIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization

  const setID = request.params.cylinderSetId;

  await knexController.transaction(async (trx) => {
    // Get id's of cylinders that belong to given set.
    const rowData = await trx
      .select('cylinder')
      .from<Cylinder>('diving_cylinder_to_set')
      .where('cylinder_set', setID);

    if (rowData.length === 0) {
      return errorHandler(reply, 404, 'No set with given id found.');
    }

    // Delete cylinders from set.
    await trx('diving_cylinder_to_set').where('cylinder_set', setID).del();

    // Delete single cylinders.
    // Knex queries return RowDataPacket obj's, and can't get them to work with whereIn :)
    const cylinders: string[] = Object.values(
      JSON.parse(JSON.stringify(rowData))
    );

    await trx.from('diving_cylinder').whereIn('id', cylinders).del();

    // Delete set.
    await trx('diving_cylinder_set').where('id', setID).del();
  });

  await reply.code(200).send({ setID, message: 'Set deleted successfully!' });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'DELETE',
    url: '/:cylinderSetId',
    handler,
    schema,
  });
};
