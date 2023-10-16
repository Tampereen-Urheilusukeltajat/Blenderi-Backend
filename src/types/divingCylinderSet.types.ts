import { Type, Static } from '@sinclair/typebox';

export const createDivingCylinderBody = Type.Object({
  volume: Type.Number({ exclusiveMinimum: 0, maximum: 100 }),
  pressure: Type.Integer({ exclusiveMinimum: 0, maximum: 500 }),
  material: Type.String(),
  serialNumber: Type.String(),
  inspection: Type.String(),
});

export type CreateDivingCylinderBody = Static<typeof createDivingCylinderBody>;

export const divingCylinder = Type.Intersect([
  Type.Object({ id: Type.String({ format: 'uuid' }) }),
  createDivingCylinderBody,
]);

export type DivingCylinder = Static<typeof divingCylinder>;

export const updateDivingCylinderBody = Type.Object({
  id: Type.String({ format: 'uuid' }),
  volume: Type.Optional(Type.Number({ exclusiveMinimum: 0, maximum: 100 })),
  pressure: Type.Optional(Type.Integer({ exclusiveMinimum: 0, maximum: 500 })),
  material: Type.Optional(Type.String()),
  serialNumber: Type.Optional(Type.String()),
  inspection: Type.Optional(Type.String({ format: 'date' })),
});

export type UpdateDivingCylinderBody = Static<typeof updateDivingCylinderBody>;

export const createDivingCylinderSet = Type.Object({
  owner: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 255 }),
  cylinders: Type.Array(createDivingCylinderBody, { minItems: 1 }),
});

export type CreateDivingCylinderSet = Static<typeof createDivingCylinderSet>;

export const divingCylinderSet = Type.Object({
  id: Type.String({ format: 'uuid' }),
  owner: Type.String({ format: 'uuid' }),
  name: Type.String(),
  cylinders: Type.Array(divingCylinder),
});

export type DivingCylinderSet = Static<typeof divingCylinderSet>;

export const updateDivingCylinderSet = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  cylinders: Type.Optional(Type.Array(updateDivingCylinderBody)),
});

export type UpdateDivingCylinderSet = Static<typeof updateDivingCylinderSet>;

export const divingCylinderSetIdParamsPayload = Type.Object({
  divingCylinderSetId: Type.String({ format: 'uuid' }),
});

export type DivingCylinderSetIdParamsPayload = Static<
  typeof divingCylinderSetIdParamsPayload
>;

export type DivingCylinderSetBasicInfo = Omit<DivingCylinderSet, 'cylinders'>;
export type DivingCylinderWithSetId = DivingCylinder & {
  cylinderSetId: string;
};
