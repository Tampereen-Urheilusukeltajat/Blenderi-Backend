import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('initial_blender_access_list', (table) => {
    table.string('phone_number', 128).primary();
    table.timestamps(true, true);
  });
}

export async function down(): Promise<void> {
  // Not impelemented
}
