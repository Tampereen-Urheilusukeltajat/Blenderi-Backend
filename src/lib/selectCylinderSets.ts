import { Knex } from 'knex';
import { CylinderSet } from '../types/cylinderSet.types';
import { log } from './log';
import selectSingleCylinderSet from './selectSingleCylinderSet';

export default async function selectCylinderSets(
  trx: Knex.Transaction
): Promise<CylinderSet[] | undefined> {
  const set: CylinderSet[] = await trx<CylinderSet[]>(
    'diving_cylinder_set'
  ).select('id', 'owner', 'name');

  for (const singleSet of set) {
    await selectSingleCylinderSet(trx, singleSet);

    if (singleSet.cylinders.length === 0) {
      log.error('set without cylinders', singleSet);
    }
  }

  return set;
}
