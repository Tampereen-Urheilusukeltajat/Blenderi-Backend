import { knexController } from '../database/database';
import {
  FillEventResponse,
  GasPrices,
  GasPressures,
} from '../types/fillEvent.types';

export const getGasPrice = async (gas: string): Promise<number | undefined> => {
  const res = await knexController('prices')
    .orderBy('created_at', 'desc')
    .first('price_per_litre_in_eur_cents as price')
    .where({ gas });
  if (res === undefined) return undefined;
  return res.price;
};

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
};

export const calcFillEventPrice = (
  prices: GasPrices,
  pressures: GasPressures
): number => {
  const storageVol = 50;
  const oxygenVol: number = pressures.oxygen * storageVol;
  const heliumVol: number = pressures.helium * storageVol;
  const argonVol: number = pressures.argon * storageVol;
  const diluentVol: number = pressures.diluent * storageVol;
  return (
    prices.oxygen * oxygenVol +
    prices.helium * heliumVol +
    prices.argon * argonVol +
    prices.diluent * diluentVol
  );
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
