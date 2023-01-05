import { Type, Static } from '@sinclair/typebox';

export const storageCylinderUsage = Type.Object({
  storageCylinderId: Type.Integer({ minimum: 0 }),
  startPressure: Type.Number({ minimum: 0, maximum: 500 }),
  endPressure: Type.Number({ minimum: 0, maximum: 500 }),
});

export type StorageCylinderUsage = Static<typeof storageCylinderUsage>;

export const createStorageCylinderBody = Type.Object({
  gasId: Type.String(),
  name: Type.String({ maxLength: 256 }),
  maxPressure: Type.Integer({ exclusiveMinimum: 0, maximum: 500 }),
  volume: Type.Integer({ exclusiveMinimum: 0, maximum: 200 }),
});

export type CreateStorageCylinderBody = Static<
  typeof createStorageCylinderBody
>;

export const storageCylinder = Type.Intersect([
  Type.Object({ id: Type.String() }),
  createStorageCylinderBody,
]);

export type StorageCylinder = Static<typeof storageCylinder>;
