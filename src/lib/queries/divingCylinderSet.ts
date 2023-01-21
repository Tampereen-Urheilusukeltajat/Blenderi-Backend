import { Knex } from 'knex';
import { knexController } from '../../database/database';
import { Cylinder, CylinderSet } from '../../types/cylinderSet.types';
import { log } from '../utils/log';

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

const selectSingleCylinderSet = async (
  trx: Knex.Transaction,
  set: CylinderSet,
  id?: string
): Promise<void> => {
  set.cylinders = await trx('diving_cylinder')
    .innerJoin(
      'diving_cylinder_to_set',
      'diving_cylinder.id',
      '=',
      'diving_cylinder_to_set.cylinder'
    )
    .select<Cylinder[]>(
      'id',
      'volume',
      'pressure',
      'material',
      'serial_number as serialNumber',
      'inspection'
    )
    .where('diving_cylinder_to_set.cylinder_set', id ?? '');
};

export const selectCylinderSet = async (
  trx: Knex.Transaction,
  id: string
): Promise<CylinderSet | undefined> => {
  const set: CylinderSet | undefined = await trx('diving_cylinder_set')
    .select<CylinderSet>('id', 'owner', 'name')
    .where('id', id)
    .first();

  if (set === undefined) {
    log.debug('Cylinder set seems to be missing: ' + id);
    return undefined;
  }

  await selectSingleCylinderSet(trx, set, id);

  if (set.cylinders.length === 0) {
    log.error('set without cylinders', set);
  }
  return set;
};
