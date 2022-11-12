import { Knex } from 'knex';
import { CylinderSet } from '../types/cylinderSet.types';
import { log } from './log';
import selectSingleCylinderSet from './selectSingleCylinderSet';

export default async function selectCylinderSet(
  trx: Knex.Transaction,
  id: string
): Promise<CylinderSet | undefined> {
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
}
