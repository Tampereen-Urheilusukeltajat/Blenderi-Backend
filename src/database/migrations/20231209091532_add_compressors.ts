import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('compressor', (table) => {
    table.uuid('id').defaultTo(knex.raw('UUID()')).primary();
    table.string('name', 32).notNullable();
    table.string('description', 128).notNullable();
    table.boolean('is_enabled').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.alterTable('fill_event', (table) => {
    table.uuid('compressor').references('id').inTable('compressor');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('fill_event', (table) => {
    table.dropForeign('compressor');
    table.dropColumn('compressor');
  });

  await knex.schema.dropTableIfExists('compressor');
}
