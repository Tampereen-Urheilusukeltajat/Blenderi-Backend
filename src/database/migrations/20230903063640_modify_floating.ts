import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
  ALTER TABLE gas_price
  MODIFY price_eur_cents FLOAT(6,2) NOT NULL DEFAULT '0.00';
`);
}

export async function down(knex: Knex): Promise<void> {
  // noop
}
