import { knexController } from '../database/database';
import { v4 as uuid } from 'uuid';
import { FillEventResponse } from '../types/fillEvent.types';

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
  airPressure: number,
  oxygenPressure: number,
  heliumPressure: number,
  argonPressure: number,
  diluentPressure: number,
  price: number,
  info: string | undefined
): Promise<void> => {
  const eventId = uuid();
  // console.log(eventId);

  await knexController('fill_event').insert({
    id: eventId,
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

export const selectLatestFillEventByUser = async (
  userId: string
): Promise<FillEventResponse> => {
  const res = await knexController('fill_event')
    .where('user', userId)
    .orderBy('created_at', 'desc')
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
