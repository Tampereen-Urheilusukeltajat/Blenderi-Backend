import { knexController } from '../database/database';
import {
  CreateFillEventBody,
  FillEventResponse,
  StorageCylinder,
  GasPrice,
  Gas,
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

export const getGasName = async (
  trx: Knex.Transaction,
  gasId: number
): Promise<string | undefined> => {
  const name = await trx('gas').where('gas_id', gasId).first('name');
  if (name === undefined) {
    log.error(`Unknown gas id: ${gasId}`);
  }
  return name;
};

export const getActivePriceId = async (
  trx: Knex.Transaction,
  gasId: number
): Promise<number> => {
  const prices: GasPrice = await trx<GasPrice>('gas_price')
    .where('gas_id', gasId)
    .andWhere('active_to', '>', knexController.fn.now())
    .andWhere('active_from', '<', knexController.fn.now())
    .select('id');
  /*
  if (prices.length > 1) {
    log.error(`Multiple active prices were found for gasId: ${gasId}`);
    throw new Error(`Multiple active prices`);
  } else if (prices.length === 0) {
    log.error(`No price was found for gasId: ${gasId}`);
    throw new Error(`Price not found`);
  } */
  return prices[0].id;
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
): Promise<{ status: number; message: string }> => {
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
  // Use knex.raw to enable use of RETURNING clause to avoid race conditions
  const res = await trx.raw(
    'INSERT INTO fill_event (user_id, cylinder_set_id, gas_mixture, description) VALUES (?,?,?,?) RETURNING id',
    [user.id, cylinderSetId, gasMixture, description]
  );
  const fillEventId = JSON.parse(JSON.stringify(res))[0][0].id;

  try {
    if (filledAir) {
      const airGasId = await getAirGasId(trx);
      const airPriceId = await getActivePriceId(trx, airGasId);
      await trx('fill_event_gas_fill').insert({
        fill_event_id: fillEventId,
        gas_price_id: airPriceId,
      });
    }
    await Promise.all(
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
  return { status: 201, message: 'Fill event created successfully' };
};
/*

export const getGasPrice = async (gas: string): Promise<number | undefined> => {
  const res = await knexController('prices')
    .orderBy('created_at', 'desc')
    .first('price_per_litre_in_eur_cents as price')
    .where({ gas });
  if (res === undefined) return undefined;
  return res.price;
}; */
/*
export const getGasPrices = async (): Promise<GasPrices | undefined> => {
  const oxygen = await getGasPrice('oxygen');
  const helium = await getGasPrice('helium');
  const argon = await getGasPrice('argon');
  const diluent = await getGasPrice('diluent');
  if (
    oxygen === undefined ||
    helium === undefined ||
    argon === undefined ||
    diluent === undefined
  ) {
    return undefined;
  }
  return {
    oxygen,
    helium,
    argon,
    diluent,
  };
}; */

export const insertFillEvent = async (
  id: string,
  userId: string,
  cylinderSet: string,
  airPressure: number,
  oxygenPressure: number,
  heliumPressure: number,
  argonPressure: number,
  diluentPressure: number,
  price: number,
  info: string | undefined
): Promise<void> => {
  await knexController('fill_event').insert({
    id,
    user: userId,
    cylinder_set: cylinderSet,
    air_pressure: airPressure,
    oxygen_pressure: oxygenPressure,
    helium_pressure: heliumPressure,
    argon_pressure: argonPressure,
    diluent_pressure: diluentPressure,
    price,
    info,
  });
};

export const selectFillEventByUser = async (
  userId: string,
  id: string
): Promise<FillEventResponse> => {
  const res = await knexController('fill_event')
    .where('id', id)
    .first<FillEventResponse>(
      'id',
      'user as userId',
      'cylinder_set as cylinderSetId',
      'air_pressure as airPressure',
      'oxygen_pressure as oxygenPressure',
      'helium_pressure as heliumPressure',
      'argon_pressure as argonPressure',
      'diluent_pressure as diluentPressure',
      'price',
      'info'
    );

  return res;
};
