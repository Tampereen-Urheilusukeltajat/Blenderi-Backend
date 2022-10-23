import { Knex } from 'knex';
import { Cylinder, CylinderSet } from '../types/cylinderSet.types';
import { log } from './log';

export default async function selectCylinderSets(
  trx: Knex.Transaction
): Promise<CylinderSet[] | undefined> {
  const set: CylinderSet[] | undefined = await trx(
    'diving_cylinder_set'
  ).select<CylinderSet[]>('id', 'owner', 'name');

  for (const singleSet of set) {
    singleSet.cylinders = await trx('diving_cylinder')
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
      .where('diving_cylinder_to_set.cylinder_set', singleSet.id);

    if (singleSet.cylinders.length === 0) {
      log.error('set without cylinders', singleSet);
      return undefined;
    }
  }

  return set;
}
