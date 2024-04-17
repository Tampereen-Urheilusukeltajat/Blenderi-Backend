import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    INSERT INTO gas_price (gas_id, price_eur_cents, active_from)
    VALUES (1, 0, '2000-01-01'), (2, 0, '2000-01-01'), (3, 0, '2000-01-01'), (4, 0, '2000-01-01'), (5, 0, '2000-01-01'); 
  `);
}

export async function down(): Promise<void> {
  // noop
}
