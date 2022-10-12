import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('diving_cylinder', (table) => {
    table.uuid('id').primary();
    table.integer('volume').notNullable();
    table.integer('pressure').notNullable();
    table.string('material', 32).notNullable();
    table.string('serial_number', 64).notNullable();
    table.date('inspection').notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('tank_set', (table) => {
    table.uuid('id').primary();
    table.uuid('owner').references('id').inTable('user').notNullable();
    table.string('name', 255).unique().notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('tank_set_diving_cylinder', (table) => {
    table
      .uuid('cylinder')
      .references('id')
      .inTable('diving_cylinder')
      .primary();
    table.uuid('tank_set').references('id').inTable('tank_set').primary();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('tank_set_diving_cylinder');
  await knex.schema.dropTable('tank_set');
  await knex.schema.dropTable('diving_cylinder');
}
