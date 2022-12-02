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
  const storageCylinderQuery = await trx<StorageCylinder>('storage_cylinder')
    .where('id', id)
    .first('id', 'gas_id as gasId', 'volume', 'name');

  if (storageCylinderQuery === undefined) {
    log.error('Storage cylinder not found');
    throw new Error('Storage cylinder not found');
  }

  const sc: StorageCylinder = JSON.parse(JSON.stringify(storageCylinderQuery));
  return sc;
};

export const createStorageCylinder = async (
  payload: CreateStorageCylinderBody,
  trx?: Knex.Transaction
): Promise<StorageCylinder> => {
  const transaction = trx ?? (await knexController.transaction());
  const insertedSCId = await transaction('storage_cylinder').insert({
    gas_id: payload.gasId,
    max_pressure: payload.maxPressure,
    name: payload.name,
    volume: payload.volume,
  })[0];

  return getStorageCylinder(transaction, insertedSCId);
};
