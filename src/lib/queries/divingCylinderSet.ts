import { Knex } from 'knex';
import { knexController } from '../../database/database';
import {
  DivingCylinder,
  DivingCylinderSet,
  DivingCylinderSetBasicInfo,
  DivingCylinderWithSetId,
} from '../../types/divingCylinderSet.types';
import { DBResponse } from '../../types/general.types';
import { log } from '../utils/log';

export const divingCylinderSetExists = async (
  divingCylinderSetId: string,
  userId: string,
  trx?: Knex.Transaction
): Promise<boolean> => {
  const transaction = trx ?? knexController;

  const [exists] = await transaction.raw<DBResponse<number[]>>(
    `
    SELECT
      1
    FROM diving_cylinder_set
    WHERE
      id = :divingCylinderSetId AND
      owner = :userId
  `,
    {
      divingCylinderSetId,
      userId,
    }
  );

  if (exists.length) return true;

  return false;
};

export const archiveDivingCylinderSet = async (
  divingCylinderSetId: string,
  trx?: Knex.Transaction
): Promise<void> => {
  const transaction = trx ?? knexController;

  await transaction.raw(
    `
    UPDATE diving_cylinder_set
    SET archived = true
    WHERE
      id = :divingCylinderSetId
  `,
    {
      divingCylinderSetId,
    }
  );
};

export const getUsersDivingCylinderSets = async (
  userId: string,
  trx?: Knex.Transaction
): Promise<DivingCylinderSet[]> => {
  const transaction = trx ?? knexController;

  const [divingCylinderSets] = await transaction.raw<
    DBResponse<DivingCylinderSetBasicInfo[]>
  >(
    `
    SELECT
      id,
      owner,
      name
    FROM diving_cylinder_set
    WHERE
      owner = :userId AND
      archived = 0
  `,
    {
      userId,
    }
  );

  if (divingCylinderSets.length === 0) return [];

  const [divingCylinders] = await transaction.raw<
    DBResponse<DivingCylinderWithSetId[]>
  >(
    `
    SELECT
      dc.id,
      dc.volume,
      dc.pressure,
      dc.material,
      dc.serial_number AS serialNumber,
      dc.inspection,
      dcts.cylinder_set AS cylinderSetId
    FROM diving_cylinder_to_set dcts
    JOIN diving_cylinder dc ON 
      dcts.cylinder = dc.id
    WHERE
      dcts.cylinder_set IN (${divingCylinderSets.map(() => '?').join(',')})
  `,
    [...divingCylinderSets.map((dcs) => dcs.id)]
  );

  return divingCylinderSets.map((dcts) => ({
    ...dcts,
    cylinders: [
      ...divingCylinders.filter((dc) => dc.cylinderSetId === dcts.id),
    ],
  }));
};

/**
 * @deprecated
 */
const selectSingleCylinderSet = async (
  trx: Knex.Transaction,
  set: DivingCylinderSet,
  id?: string
): Promise<void> => {
  set.cylinders = await trx('diving_cylinder')
    .innerJoin(
      'diving_cylinder_to_set',
      'diving_cylinder.id',
      '=',
      'diving_cylinder_to_set.cylinder'
    )
    .select<DivingCylinder[]>(
      'id',
      'volume',
      'pressure',
      'material',
      'serial_number as serialNumber',
      'inspection'
    )
    .where('diving_cylinder_to_set.cylinder_set', id ?? '');
};

/**
 * @deprecated
 */
export const selectCylinderSet = async (
  trx: Knex.Transaction,
  id: string
): Promise<DivingCylinderSet | undefined> => {
  const set: DivingCylinderSet | undefined = await trx('diving_cylinder_set')
    .select<DivingCylinderSet>('id', 'owner', 'name')
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
