import { knexController } from '../database/database';
import {
  CreateFillEventBody,
  FillEventResponse,
  StorageCylinder,
  GasPrice,
  FillEvent,
} from '../types/fillEvent.types';
import { AuthUser } from '../types/auth.types';
import { User } from '../types/user.types';
import selectCylinderSet from './selectCylinderSet';
import { log } from './log';
import { Knex } from 'knex';

export const getStorageCylinder = async (
  trx: Knex.Transaction,
  id: number
): Promise<StorageCylinder | undefined> => {
  const storageCylinder = await trx<StorageCylinder>('storage_cylinder')
    .where('storageCylinderId', id)
    .first(
      'storage_cylinder_id as storageCylinderId',
      'gas_id as gasId',
      'volume',
      'name'
    );
  return storageCylinder;
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

export const getActivePrice = async (
  trx: Knex.Transaction,
  gasId: number
): Promise<number | undefined> => {
  const prices = await trx<GasPrice>('gas_price')
    .where('id', gasId)
    .andWhere('active_to', '>', knexController.fn.now())
    .andWhere('active_from', '<', knexController.fn.now())
    .select('price_eur_cents as priceEurCents');

  if (prices.length > 1) {
    log.error(`Multiple active prices were found for gasId: ${gasId}`);
    return undefined;
  } else if (prices.length === 0) {
    log.error(`No price was found for gasId: ${gasId}`);
    return undefined;
  }
  return prices[0].id;
};

// export const calcPrize = async (price: number, storageCylinder: StorageCylinder) => {

export const createFillEvent = async (
  authUser: AuthUser,
  body: CreateFillEventBody
): Promise<{ status: number; message: string }> => {
  const {
    cylinderSetId,
    gasMixture,
    airPressure,
    storageCylinderUsage,
    description,
  } = body;

  if (airPressure === 0 && storageCylinderUsage.length === 0) {
    return { status: 400, message: 'No gases were given' };
  }

  const trx = await knexController.transaction();
  const userQuery = trx<User>('user')
    .where('id', authUser.id)
    .first('id', 'is_blender as isBlender');
  const user: User = JSON.parse(JSON.stringify(userQuery));
  if (!user.isBlender && storageCylinderUsage.length !== 0) {
    await trx.rollback();
    return { status: 403, message: 'User does not have blender priviledges' };
  }
  const set = selectCylinderSet(trx, cylinderSetId);
  if (set === undefined) {
    await trx.rollback();
    return { status: 400, message: 'Cylinder set was not found' };
  }
  await trx('fill_event').insert({
    user_id: user.id,
    cylinder_set_id: cylinderSetId,
    gasMixture,
    description,
  });
  // surely this will not cause any problems, right? =)
  const lastEvent = trx<FillEvent>('fill_event')
    .where('user_id', user.id)
    .first('fill_event_id as fillEventId');
  log.debug('lastEvent:', lastEvent);
  try {
    await Promise.all(
      storageCylinderUsage.map(async (scu): Promise<void> => {
        const storageCylinder = await getStorageCylinder(
          trx,
          scu.storageCylinderId
        );
        if (storageCylinder === undefined) {
          log.error(
            `Storage cylinder was not found with given id: ${scu.storageCylinderId}`
          );
          throw new Error('Storage cylinder not found');
        }
        const priceId = await getActivePrice(trx, storageCylinder.gasId);
        if (priceId === undefined) {
          throw new Error('Price not found');
        }
        await trx('fill_event_gas_fill').insert({
          fill_event_id: lastEvent,
          gas_price_id: priceId,
          storage_cylinder_id: storageCylinder.storageCylinderId,
          volume_litres:
            scu.startPressure - scu.endPressure * storageCylinder.volume,
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
      default:
        log.error(e.message);
        return { status: 500, message: 'Internal server error' };
    }
  }
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
