import { Knex } from 'knex';

import { Cylinder, CylinderSet } from '../types/cylinderSet.types';

import { log } from './log';

export default async function selectCylinderSet(
  trx: Knex.Transaction,
  id: string
): Promise<CylinderSet | undefined> {
  const set: CylinderSet | undefined = await trx('diving_cylinder_set')
    .select<CylinderSet>('id', 'owner', 'name')
    .where('id', id)
    .first();

  if (set === undefined) {
    log.info('Cylinder set seems to be missing: ' + id);
    return undefined;
  }

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
    .where('diving_cylinder_to_set.cylinder_set', id);

  return set;
}
