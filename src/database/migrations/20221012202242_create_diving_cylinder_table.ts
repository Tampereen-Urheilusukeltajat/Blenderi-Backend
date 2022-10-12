import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('diving_cylinder', (table) => {
    table.uuid('id').primary();
    table.uuid('owner').references('id').inTable('user').notNullable();
    table.string('name', 255).notNullable();
    table.integer('volume').notNullable();
    table.integer('pressure').notNullable();
    table.string('material', 32).notNullable();
    table.string('serial_number', 64).notNullable();
    table.date('inspection').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('diving_cylinder');
}
