import { Type, Static } from '@sinclair/typebox';

export const fillEvent = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  cylinderSetId: Type.String({ format: 'uuid' }),
  airPressure: Type.Integer({ minimum: 0, default: 0 }),
  oxygenPressure: Type.Integer({ minimum: 0, default: 0 }),
  heliumPressure: Type.Integer({ minimum: 0, default: 0 }),
  argonPressure: Type.Integer({ minimum: 0, default: 0 }),
  diluentPressure: Type.Integer({ minimum: 0, default: 0 }),
  price: Type.Integer({ minimum: 0 }),
  info: Type.String({ maxLength: 1024 }),
});

export type FillEvent = Static<typeof fillEvent>;

export const createFillEventBody = Type.Object({
  cylinderSetId: Type.String({ format: 'uuid' }),
  airPressure: Type.Integer({ minimum: 0, default: 0 }),
  oxygenPressure: Type.Integer({ minimum: 0, default: 0 }),
  heliumPressure: Type.Integer({ minimum: 0, default: 0 }),
  argonPressure: Type.Integer({ minimum: 0, default: 0 }),
  diluentPressure: Type.Integer({ minimum: 0, default: 0 }),
  info: Type.Optional(Type.String({ maxLength: 1024 })),
});

export type CreateFillEventBody = Static<typeof createFillEventBody>;

export const fillEventResponse = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  cylinderSetId: Type.String({ format: 'uuid' }),
  airPressure: Type.Optional(Type.Integer({ minimum: 0 })),
  oxygenPressure: Type.Optional(Type.Integer({ minimum: 0 })),
  heliumPressure: Type.Optional(Type.Integer({ minimum: 0 })),
  argonPressure: Type.Optional(Type.Integer({ minimum: 0 })),
  diluentPressure: Type.Optional(Type.Integer({ minimum: 0 })),
  price: Type.Integer({ minimum: 0 }),
  info: Type.String({ maxLength: 1024 }),
});

export type FillEventResponse = Static<typeof fillEventResponse>;

export const gasPrices = Type.Object({
  oxygenPrice: Type.Integer({ minimum: 0 }),
  heliumPrice: Type.Integer({ minimum: 0 }),
  argonPrice: Type.Integer({ minimum: 0 }),
  diluentPrice: Type.Integer({ minimum: 0 }),
});
export type GasPrices = Static<typeof gasPrices>;

export const gasPressures = Type.Object({
  air: Type.Integer({ minimum: 0 }),
  oxygen: Type.Integer({ minimum: 0 }),
  helium: Type.Integer({ minimum: 0 }),
  argon: Type.Integer({ minimum: 0 }),
  diluent: Type.Integer({ minimum: 0 }),
});
export type GasPressures = Static<typeof gasPressures>;
