import { knexController } from '../database/database';

export const getGasPrice = async (gas: string): Promise<number> => {
  const res = await knexController('prices')
    .orderBy('created_at', 'desc')
    .first('price')
    .where({ gas });
  return res.price;
};

export const insertFillEvent = async (
  userId: string,
  cylinderSet: string,
  airPressure: number | undefined,
  oxygenPressure: number | undefined,
  heliumPressure: number | undefined,
  argonPressure: number | undefined,
  diluentPressure: number | undefined,
  price: number,
  info: string | undefined
): Promise<void> => {
  await knexController('fill_event').insert({
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
