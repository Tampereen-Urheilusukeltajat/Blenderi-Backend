import { Knex } from 'knex';
import { knexController } from '../database/database';
import {
  CreateStorageCylinderBody,
  StorageCylinder,
} from '../types/storageCylinder.types';
import { log } from './log';

export const getStorageCylinder = async (
  trx: Knex.Transaction,
  id: number
): Promise<StorageCylinder> => {
  const storageCylinder = await trx<StorageCylinder>('storage_cylinder')
    .where('id', id)
    .first(
      'id',
      'gas_id AS gasId',
      'volume',
      'name',
      'max_pressure AS maxPressure'
    );

  if (storageCylinder === undefined) {
    log.error('Storage cylinder not found');
    throw new Error('Storage cylinder not found');
  }

  return JSON.parse(JSON.stringify(storageCylinder));
};

export const createStorageCylinder = async (
  payload: CreateStorageCylinderBody,
  trx?: Knex.Transaction
): Promise<StorageCylinder> => {
  const transaction = trx ?? (await knexController.transaction());
  const sql =
    'INSERT INTO storage_cylinder (gas_id, max_pressure, name, volume) VALUES (?,?,?,?) RETURNING id';
  const params = [
    payload.gasId,
    payload.maxPressure,
    payload.name,
    payload.volume,
  ];

  // Type source: trust me bro & trial and error
  const res = await transaction.raw<Array<Array<{ id: number }>>>(sql, params);
  const [[{ id: insertedStorageCylinderId }]] = res;

  const insertedSC = await getStorageCylinder(
    transaction,
    insertedStorageCylinderId
  );

  await transaction.commit();

  return insertedSC;
};
