import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE fill_event DROP CONSTRAINT fill_event_compressor_foreign`,
  );

  await knex.schema.alterTable('fill_event', (table) => {
    table.renameColumn('compressor', 'compressor_id');
    table.foreign('compressor_id', 'fk_fill_event_compressor');
  });
}

export async function down(): Promise<void> {
  // noop
}
