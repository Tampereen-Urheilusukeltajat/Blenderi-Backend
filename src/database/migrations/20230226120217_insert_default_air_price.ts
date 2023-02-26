import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    INSERT INTO gas_price (gas_id, price_eur_cents, active_from)
    VALUES (1, 0, NOW()), (2, 0, NOW()), (3, 0, NOW()), (4, 0, NOW()), (5, 0, NOW()); 
  `);
}

export async function down(): Promise<void> {
  // noop
}
