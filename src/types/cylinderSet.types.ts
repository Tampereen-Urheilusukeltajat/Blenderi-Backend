import { Type, Static } from '@sinclair/typebox';

export const createCylinderBody = Type.Object({
  volume: Type.Integer({ exclusiveMinimum: 0, maximum: 100 }),
  pressure: Type.Integer({ exclusiveMinimum: 0, maximum: 500 }),
  material: Type.String(),
  serialNumber: Type.String(),
  inspection: Type.String(),
});

export type CreateCylinderBody = Static<typeof createCylinderBody>;

export const cylinder = Type.Intersect([
  Type.Object({ id: Type.String() }),
  createCylinderBody,
]);

export type Cylinder = Static<typeof cylinder>;

export const updateCylinderBody = Type.Object({
  id: Type.String({ format: 'uuid' }),
  volume: Type.Optional(Type.Integer({ exclusiveMinimum: 0, maximum: 100 })),
  pressure: Type.Optional(Type.Integer({ exclusiveMinimum: 0, maximum: 500 })),
  material: Type.Optional(Type.String()),
  serialNumber: Type.Optional(Type.String()),
  inspection: Type.Optional(Type.String({ format: 'date' })),
});

export type UpdateCylinderBody = Static<typeof updateCylinderBody>;

export const createCylinderSet = Type.Object({
  owner: Type.String(),
  name: Type.String({ minLength: 1, maxLength: 255 }),
  cylinders: Type.Array(createCylinderBody, { minItems: 1 }),
});

export type CreateCylinderSet = Static<typeof createCylinderSet>;

export const cylinderSet = Type.Object({
  id: Type.String(),
  owner: Type.String(),
  name: Type.String(),
  cylinders: Type.Array(cylinder),
});

export type CylinderSet = Static<typeof cylinderSet>;

export const updateCylinderSet = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  cylinders: Type.Optional(Type.Array(updateCylinderBody)),
});

export type UpdateCylinderSet = Static<typeof updateCylinderSet>;

export const cylinderSetIdParamsPayload = Type.Object({
  cylinderSetId: Type.String({ format: 'uuid' }),
});

export type CylinderSetIdParamsPayload = Static<
  typeof cylinderSetIdParamsPayload
>;
