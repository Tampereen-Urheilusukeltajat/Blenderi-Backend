import { knexController } from '../../database/database';
import {
  CreateFillEventBody,
  FillEventGasFill,
  GetFillEventsResponse,
  FillEvent,
} from '../../types/fillEvent.types';
import { AuthUser } from '../../types/auth.types';
import { User } from '../../types/user.types';
import { log } from '../utils/log';
import { Knex } from 'knex';
import { getStorageCylinder } from './storageCylinder';
import { Gas, GasPrice } from '../../types/gas.types';
import { selectCylinderSet } from './divingCylinderSet';

const getActivePriceId = async (
  trx: Knex.Transaction,
  gasId: string
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

const getAirGasId = async (trx: Knex.Transaction): Promise<string> => {
  const air = await trx<Gas>('gas').where('name', 'Air').first('id');

  if (air === undefined) {
    log.error('Gas id was not found for air');
    throw new Error('Gas id was not found for air');
  }

  return air.id;
};

export const getFillEvents = async (
  userId: string
): Promise<GetFillEventsResponse[]> => {
  const trx = await knexController.transaction();

  const fillQuery = await trx<FillEvent[]>('fill_event')
    .where('user_id', userId)
    .select(
      'id',
      'user_id as userId',
      'cylinder_set_id as cylinderSetId',
      'gas_mixture as gasMixture',
      'description'
    );

  const result = await Promise.all(
    fillQuery.map(async (fillEvent): Promise<GetFillEventsResponse> => {
      const price = await calcTotalCost(trx, fillEvent.id);

      return {
        userId: fillEvent.userId,
        cylinderSetId: fillEvent.cylinderSetId,
        gasMixture: fillEvent.gasMixture,
        description: fillEvent.description,
        price,
      };
    })
  );

  await trx.commit();
  return result;
};

export const createFillEvent = async (
  authUser: AuthUser,
  body: CreateFillEventBody
): Promise<{ status: number; message?: string; fillEventId?: number }> => {
  const {
    cylinderSetId,
    gasMixture,
    filledAir,
    storageCylinderUsageArr,
    description,
    price,
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
    return { status: 403, message: 'User does not have blender privileges' };
  }

  const set = await selectCylinderSet(trx, cylinderSetId);
  if (set === undefined) {
    await trx.rollback();
    return { status: 400, message: 'Cylinder set was not found' };
  }
  const params: Array<string | null> = [user.id, cylinderSetId, gasMixture];
  const sql =
    'INSERT INTO fill_event (user_id, cylinder_set_id, gas_mixture, description) VALUES (?,?,?,?) RETURNING id';

  /**
   * Rule is disabled as all possible falsy (empty string and undefined) values should lead to a null-value
   * being inserted into the database thus being safe
   */
  // eslint-disable-next-line  @typescript-eslint/strict-boolean-expressions
  description ? params.push(description) : params.push(null);

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
        if (scu.startPressure < scu.endPressure) {
          throw new Error('Negative fill pressure');
        }
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
            Math.ceil(scu.startPressure - scu.endPressure) *
            storageCylinder.volume,
        });
      })
    );
  } catch (e) {
    await trx.rollback();
    switch (e.message) {
      case 'Storage cylinder not found':
        return { status: 400, message: 'Invalid storage cylinder' };
      case 'Price not found':
        return { status: 500 };
      case 'Multiple active prices':
        return { status: 500 };
      case 'Gas id was not found for air':
        return { status: 500 };
      case 'Negative fill pressure':
        return { status: 400, message: 'Cannot have negative fill pressure' };
      default:
        log.error(e.message);
        return { status: 500 };
    }
  }
  // Check that the price advertised to the user is correct
  const totalCost = await calcTotalCost(trx, fillEventId);
  if (totalCost !== price) {
    await trx.rollback();
    return { status: 400, message: 'Client price did not match server price' };
  }
  await trx.commit();
  return {
    status: 201,
    message: 'Fill event created successfully',
    fillEventId,
  };
};

export const calcTotalCost = async (
  trx: Knex.Transaction,
  id: number
): Promise<number> => {
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
        // compressed air
        return 0;
      }
      const gasPrice: GasPrice = await trx<GasPrice>('gas_price')
        .where('id', fill.gasPriceId)
        .first('price_eur_cents as priceEurCents');
      const price = JSON.parse(JSON.stringify(gasPrice));
      return fill.volumeLitres * price.priceEurCents;
    })
  );
  const totalPrice = pricesPerGas.reduce((acc, curValue) => acc + curValue);
  return totalPrice;
};
