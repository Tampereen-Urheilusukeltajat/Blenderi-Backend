import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE fill_event_gas_fill DROP PRIMARY KEY;`);
  await knex.raw(
    'ALTER TABLE fill_event_gas_fill ADD CONSTRAINT PRIMARY KEY (fill_event_id, storage_cylinder_id)'
  );
}

export async function down(): Promise<void> {
  // noop
}
