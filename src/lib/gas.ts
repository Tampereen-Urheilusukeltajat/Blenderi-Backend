import { Knex } from 'knex';
import { knexController } from '../database/database';
import { Gas } from '../types/fillEvent.types';

export const getGases = async (trx?: Knex.Transaction): Promise<Gas[]> => {
  const transaction = trx ?? knexController;

  return transaction('gas').select<Gas[]>(['id', 'name']);
};

export const getGasById = async (
  gasId: number,
  trx?: Knex.Transaction
): Promise<Gas | undefined> => {
  const transaction = trx ?? knexController;

  return transaction('gas').where('id', gasId).first('id', 'name');
};
