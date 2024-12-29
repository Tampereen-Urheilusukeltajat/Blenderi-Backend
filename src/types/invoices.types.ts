import { type Static, Type } from '@fastify/type-provider-typebox';
import { minifiedUserResponse } from './user.types';

const invoiceRow = Type.Object({
  id: Type.Number(),
  date: Type.Date(),
  description: Type.String(),
  gasMixture: Type.String(),
});

export type InvoiceRow = Static<typeof invoiceRow>;

export const invoice = Type.Object({
  user: minifiedUserResponse,
  invoiceTotal: Type.Number({ minimum: 0 }),
  invoiceRows: Type.Array(invoiceRow),
});

export type Invoice = Static<typeof invoice>;