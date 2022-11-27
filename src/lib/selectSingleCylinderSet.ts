import { Knex } from 'knex';
import { Cylinder, CylinderSet } from '../types/cylinderSet.types';

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

export default selectSingleCylinderSet;
