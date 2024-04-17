import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`SET foreign_key_checks = 0;`);
  await knex.raw(`ALTER TABLE fill_event_gas_fill DROP PRIMARY KEY;`);
  await knex.raw(
    'ALTER TABLE fill_event_gas_fill ADD COLUMN id UUID DEFAULT UUID() NOT NULL PRIMARY KEY;',
  );
  await knex.raw(`SET foreign_key_checks = 1;`);
}

export async function down(): Promise<void> {
  // noop
}
