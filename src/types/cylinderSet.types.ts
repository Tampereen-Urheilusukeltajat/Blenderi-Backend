import { Type, Static } from '@sinclair/typebox';
import { create } from 'domain';

export const createCylinderBody = Type.Object({
  volume: Type.Integer(),
  pressure: Type.Integer(),
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

export const createCylinderSet = Type.Object({
  owner: Type.String(),
  name: Type.String(),
  cylinders: Type.Array(createCylinderBody),
});

export type CreateCylinderSet = Static<typeof createCylinderSet>;

export const cylinderSet = Type.Object({
  id: Type.String(),
  owner: Type.String(),
  name: Type.String(),
  cylinders: Type.Array(cylinder),
});

export type CylinderSet = Static<typeof cylinderSet>;
