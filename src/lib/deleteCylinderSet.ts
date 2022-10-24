import { knexController } from '../database/database';
import { Cylinder } from '../types/cylinderSet.types';

export const deleteCylinderSet = async (
  setID: string
): Promise<{ status: number; message: string }> => {
  const knexRes = await knexController.transaction(async (trx) => {
    // Get id's of cylinders that belong to given set.
    const rowData = await trx
      .select('cylinder')
      .from<Cylinder>('diving_cylinder_to_set')
      .where('cylinder_set', setID);

    if (rowData.length === 0) {
      return { status: 404, message: 'No set with given id found.' };
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

    return { status: 200, message: 'Set deleted successfully.' };
  });

  return knexRes;
};
