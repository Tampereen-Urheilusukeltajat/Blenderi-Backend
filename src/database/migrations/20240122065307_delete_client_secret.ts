import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE stripe_payment_intent DROP COLUMN client_secret`);
}

export async function down(): Promise<void> {
  // noop
}
