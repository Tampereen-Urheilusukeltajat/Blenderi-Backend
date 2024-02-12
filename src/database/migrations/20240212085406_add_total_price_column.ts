import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE payment_event
    ADD COLUMN total_amount_eur_cents INT UNSIGNED NOT NULL DEFAULT 0;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // noop
}
