import { Knex } from 'knex';
import { knexController } from '../database/database';
import { CreateGasPrice, EnrichedGas, Gas } from '../types/gas.types';

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

export const getEnrichedGasWithPriceId = async (
  gasPriceId: number,
  trx?: Knex.Transaction
): Promise<EnrichedGas | undefined> => {
  const transaction = trx ?? knexController;

  const sql = `
    SELECT
      g.id AS gasId,
      g.name AS gasName,
      gp.id AS gasPriceId,
      gp.price_eur_cents AS priceEurCents,
      gp.active_from AS activeFrom,
      gp.active_to AS activeTo
    FROM
      gas g
    JOIN
      gas_price gp ON g.id = gp.gas_id AND
      gp.id = :gasPriceId      
  `;
  const params = {
    gasPriceId,
  };

  return transaction.raw(sql, params);
};

/**
 * This function only works when the following conditions are true
 * 1. There can only exist one price at a certain time
 * 2. The existing price has activeTo value of 9999-01-01 00:00:00
 * 3. currentDateTime <= activeFrom < 9999-01-01 00:00:00
 *
 * This function MUST be modified when the application starts to support
 * creating dynamic price ranges
 */
export const getEnrichedGasWithActiveFrom = async (
  activeFrom: string,
  trx?: Knex.Transaction
): Promise<EnrichedGas | undefined> => {
  const transaction = trx ?? knexController;

  const sql = `
  SELECT
    g.id AS gasId,
    g.name AS gasName,
    gp.id AS gasPriceId,
    gp.price_eur_cents AS priceEurCents,
    gp.active_from AS activeFrom,
    gp.active_to AS activeTo
  FROM
    gas g
  JOIN
    gas_price gp ON g.id = gp.gas_id
  WHERE
    gp.active_from <= :activeFrom AND
    gp.active_to > :activeFrom
  `;
  const params = {};

  return transaction.raw(sql, params);
};

export const createGasPrice = async (
  { activeFrom, gasId, priceEurCents }: CreateGasPrice,
  trx?: Knex.Transaction
): Promise<EnrichedGas> => {
  const transaction = trx ?? (await knexController.transaction());

  // MVP default
  // In the future we might support creating gas price for certain time period
  const activeTo = '9999-01-01 00:00:00';

  // Find the current active price and update activeTo
  const activePrice = await getEnrichedGasWithActiveFrom(
    activeFrom,
    transaction
  );
  if (activePrice) {
    await transaction.raw(
      `
      UPDATE gas_price
      SET active_to = DATEADD(ss, -1, :activeTo)
      WHERE id = :id
    `,
      {
        activeTo: activeFrom,
        id: activePrice.gasPriceId,
      }
    );
  }

  const insertSql = `
    INSERT INTO gas_price (gas_id, price_eur_cents, active_from, active_to)
    VALUES (:gasId, :priceEurCents, :activeFrom, :activeTo)
  `;
  const insertParams = [gasId, priceEurCents, activeFrom, activeTo];

  const res = await transaction.raw<Array<Array<{ id: number }>>>(
    insertSql,
    insertParams
  );
  const [[{ id: insertedGasPriceId }]] = res;

  const insertedEnrichedGas = await getEnrichedGasWithPriceId(
    insertedGasPriceId,
    transaction
  );
  if (!insertedEnrichedGas) throw new Error('Gas price creation failed');

  await transaction.commit();

  return insertedEnrichedGas;
};
