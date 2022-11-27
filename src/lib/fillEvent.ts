import { knexController } from '../database/database';
import {
  CreateFillEventBody,
  StorageCylinder,
  GasPrice,
  Gas,
  FillEventGasFill,
} from '../types/fillEvent.types';
import { AuthUser } from '../types/auth.types';
import { User } from '../types/user.types';
import selectCylinderSet from './selectCylinderSet';
import { log } from './log';
import { Knex } from 'knex';

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

const getActivePriceId = async (
  trx: Knex.Transaction,
  gasId: number
): Promise<number> => {
  const prices: GasPrice[] = await trx<GasPrice>('gas_price')
    .where('gas_id', gasId)
    .andWhere('active_to', '>', knexController.fn.now())
    .andWhere('active_from', '<', knexController.fn.now())
    .select('id');
  const pricesArr = prices.map((price) => JSON.parse(JSON.stringify(price)));
  if (pricesArr.length > 1) {
    log.error(`Multiple active prices were found for gasId: ${gasId}`);
    throw new Error(`Multiple active prices`);
  } else if (prices.length === 0) {
    log.error(`No price was found for gasId: ${gasId}`);
    throw new Error(`Price not found`);
  }
  return pricesArr[0].id;
};

const getAirGasId = async (trx: Knex.Transaction): Promise<number> => {
  const air: Gas = await trx<Gas>('gas').where('name', 'Air').first('id');
  if (air === undefined) {
    log.error('Gas id was not found for air');
    throw new Error('Gas id was not found for air');
  }
  return air.id;
};

export const createFillEvent = async (
  authUser: AuthUser,
  body: CreateFillEventBody
): Promise<{ status: number; message: string; fillEventId?: number }> => {
  const {
    cylinderSetId,
    gasMixture,
    filledAir,
    storageCylinderUsageArr,
    description,
  } = body;

  if (!filledAir && storageCylinderUsageArr.length === 0) {
    return { status: 400, message: 'No gases were given' };
  }

  const trx = await knexController.transaction();
  const userQuery = await trx<User>('user')
    .where('id', authUser.id)
    .first('id', 'is_blender as isBlender');

  const user: User = JSON.parse(JSON.stringify(userQuery));

  if (!user.isBlender && storageCylinderUsageArr.length !== 0) {
    await trx.rollback();
    return { status: 403, message: 'User does not have blender priviledges' };
  }
  const set = selectCylinderSet(trx, cylinderSetId);
  if (set === undefined) {
    await trx.rollback();
    return { status: 400, message: 'Cylinder set was not found' };
  }
  const params = [user.id, cylinderSetId, gasMixture];
  let sql: string;
  if (description === undefined) {
    sql =
      'INSERT INTO fill_event (user_id, cylinder_set_id, gas_mixture) VALUES (?,?,?) RETURNING id';
  } else {
    sql =
      'INSERT INTO fill_event (user_id, cylinder_set_id, gas_mixture, description) VALUES (?,?,?,?) RETURNING id';
    params.push(description);
  }
  // Use knex.raw to enable use of RETURNING clause to avoid race conditions
  const res = await trx.raw(sql, params);
  const fillEventId = JSON.parse(JSON.stringify(res))[0][0].id;

  try {
    if (filledAir) {
      // If air is filled, save it
      const airGasId = await getAirGasId(trx);
      const airPriceId = await getActivePriceId(trx, airGasId);
      await trx('fill_event_gas_fill').insert({
        fill_event_id: fillEventId,
        gas_price_id: airPriceId,
      });
    }
    await Promise.all(
      // Save gas fills
      storageCylinderUsageArr.map(async (scu): Promise<void> => {
        const storageCylinder = await getStorageCylinder(
          trx,
          scu.storageCylinderId
        );
        const priceId = await getActivePriceId(trx, storageCylinder.gasId);
        await trx('fill_event_gas_fill').insert({
          fill_event_id: fillEventId,
          gas_price_id: priceId,
          storage_cylinder_id: storageCylinder.id,
          volume_litres:
            (scu.startPressure - scu.endPressure) * storageCylinder.volume,
        });
      })
    );
  } catch (e) {
    await trx.rollback();
    switch (e.message) {
      case 'Storage cylinder not found':
        return { status: 400, message: 'Invalid storage cylinder' };
      case 'Price not found':
        return { status: 500, message: 'Internal server error' };
      case 'Multiple active prices':
        return { status: 500, message: 'Internal server error' };
      case 'Gas id was not found for air':
        return { status: 500, message: 'Internal server error' };
      default:
        log.error(e.message);
        return { status: 500, message: 'Internal server error' };
    }
  }
  await trx.commit();
  return {
    status: 201,
    message: 'Fill event created successfully',
    fillEventId,
  };
};

export const calcTotalCost = async (id: number): Promise<number> => {
  const trx = await knexController.transaction();
  const fillings: FillEventGasFill[] = await trx<FillEventGasFill>(
    'fill_event_gas_fill'
  )
    .where('fill_event_id', id)
    .select(
      'storage_cylinder_id as storageCylinderId',
      'gas_price_id as gasPriceId',
      'volume_litres as volumeLitres'
    );
  const fillArr = fillings.map((fill) => JSON.parse(JSON.stringify(fill)));

  const pricesPerGas: number[] = await Promise.all(
    fillArr.map(async (fill): Promise<number> => {
      if (fill.storageCylinderId === null) {
        return 0;
      } // air
      else {
        // gas
        const gasPrice: GasPrice = await trx<GasPrice>('gas_price')
          .where('id', fill.gasPriceId)
          .first('price_eur_cents as priceEurCents');
        const price = JSON.parse(JSON.stringify(gasPrice));
        return fill.volumeLitres * price.priceEurCents;
      }
    })
  );
  const totalPrice = pricesPerGas.reduce((acc, curValue) => acc + curValue);
  await trx.commit();
  return totalPrice;
};
