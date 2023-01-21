import { Knex } from 'knex';
import { knexController } from '../../database/database';
import { CreateGasPriceBody, Gas, GasWithPricing } from '../../types/gas.types';
import { convertDateToMariaDBDateTime } from '../utils/dateTime';

const GAS_WITH_PRICING_COLUMNS = [
  'g.id AS gasId',
  'g.name AS gasName',
  'gp.id AS gasPriceId',
  'gp.price_eur_cents AS priceEurCents',
  'gp.active_from AS activeFrom',
  'gp.active_to AS activeTo',
].join(',');

export const getGasById = async (
  gasId: string,
  trx?: Knex.Transaction
): Promise<Gas | undefined> => {
  const transaction = trx ?? knexController;

  return transaction('gas').where('id', gasId).first('id', 'name');
};

export const getGasWithPricingWithPriceId = async (
  gasPriceId: string,
  trx?: Knex.Transaction
): Promise<GasWithPricing | undefined> => {
  const transaction = trx ?? knexController;

  const sql = `
    SELECT
      ${GAS_WITH_PRICING_COLUMNS}
    FROM
      gas g
    JOIN
      gas_price gp ON g.id = gp.gas_id AND
      gp.id = :gasPriceId;
  `;
  const params = {
    gasPriceId,
  };

  const response = await transaction.raw<GasWithPricing[][]>(sql, params);

  if (response[0].length > 1) {
    throw new Error('There can be only one active gas price at the given time');
  }

  return response[0][0];
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
export const getGasWithPricingWithActiveFrom = async (
  activeFrom: string,
  gasId: string,
  trx?: Knex.Transaction
): Promise<GasWithPricing | undefined> => {
  const transaction = trx ?? knexController;

  const sql = `
  SELECT
    ${GAS_WITH_PRICING_COLUMNS}
  FROM
    gas g
  JOIN
    gas_price gp ON g.id = gp.gas_id
  WHERE
    gp.active_from <= :activeFrom AND
    gp.active_to > :activeFrom AND
    g.id = :gasId;
  `;
  const params = {
    activeFrom,
    gasId,
  };

  const response = await transaction.raw<GasWithPricing[][]>(sql, params);

  if (response[0].length > 1) {
    throw new Error('There can be only one active gas price at the given time');
  }

  return response[0][0];
};

export const createGasPrice = async (
  { activeFrom, gasId, priceEurCents }: CreateGasPriceBody,
  trx?: Knex.Transaction
): Promise<GasWithPricing> => {
  const transaction = trx ?? (await knexController.transaction());

  // Find the current active price and update activeTo
  const activePrice = await getGasWithPricingWithActiveFrom(
    activeFrom,
    gasId,
    transaction
  );

  if (activePrice) {
    await transaction.raw(
      `
      UPDATE gas_price
      SET active_to = :activeTo
      WHERE id = :id
    `,
      {
        activeTo: convertDateToMariaDBDateTime(new Date(activeFrom)),
        id: activePrice.gasPriceId,
      }
    );
  }

  const insertSql = `
    INSERT INTO gas_price (gas_id, price_eur_cents, active_from)
    VALUES (:gasId, :priceEurCents, :activeFrom)
  `;
  const insertParams = {
    gasId,
    priceEurCents,
    activeFrom: convertDateToMariaDBDateTime(new Date(activeFrom)),
  };

  const res = await transaction.raw<Array<{ insertId: string }>>(
    insertSql,
    insertParams
  );
  const [{ insertId: insertedGasPriceId }] = res;

  const insertedGasWithPricing = await getGasWithPricingWithPriceId(
    insertedGasPriceId,
    transaction
  );
  if (!insertedGasWithPricing) throw new Error('Gas price creation failed');

  await transaction.commit();

  return insertedGasWithPricing;
};

export const getGasesWithPricing = async (
  trx?: Knex.Transaction
): Promise<GasWithPricing[]> => {
  const transaction = trx ?? knexController;

  // Date.now is not necessary, but it makes testing easier as you can only
  // mock that function and not the whole Date constructor
  const now = new Date(Date.now());

  const sql = `
    SELECT
      ${GAS_WITH_PRICING_COLUMNS}
    FROM gas g
    LEFT JOIN
      gas_price gp ON g.id = gp.gas_id AND
      gp.active_from <= :now AND
      gp.active_to > :now
  `;

  const params = {
    now,
  };

  const res = await transaction.raw<GasWithPricing[][]>(sql, params);

  return res[0] ?? [];
};
