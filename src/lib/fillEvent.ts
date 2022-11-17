import { knexController } from '../database/database';
import { FillEventResponse, GasPrices } from '../types/fillEvent.types';

export const getGasPrice = async (gas: string): Promise<number | undefined> => {
  const res = await knexController('prices')
    .orderBy('created_at', 'desc')
    .first('price')
    .where({ gas });
  return res.price;
};

export const getGasPrices = async (): Promise<GasPrices | undefined> => {
  const oxygenPrice = await getGasPrice('oxygen');
  const heliumPrice = await getGasPrice('helium');
  const argonPrice = await getGasPrice('argon');
  const diluentPrice = await getGasPrice('diluent');
  if (
    oxygenPrice === undefined ||
    heliumPrice === undefined ||
    argonPrice === undefined ||
    diluentPrice === undefined
  ) {
    return undefined;
  }
  return {
    oxygenPrice,
    heliumPrice,
    argonPrice,
    diluentPrice,
  };
};

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
  // console.log(res);

  return res;
};
