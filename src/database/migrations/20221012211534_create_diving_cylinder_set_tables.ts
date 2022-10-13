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

  await knex.schema.createTable('diving_cylinder_set', (table) => {
    table.uuid('id').primary();
    table.uuid('owner').references('id').inTable('user').notNullable();
    table.string('name', 255).notNullable();
    table.timestamps(true, true);
    table.unique(['owner', 'name']);
  });

  await knex.schema.createTable('diving_cylinder_to_set', (table) => {
    table
      .uuid('cylinder')
      .references('id')
      .inTable('diving_cylinder')
      .primary();
    table
      .uuid('cylinder_set')
      .references('id')
      .inTable('diving_cylinder_set')
      .primary();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('diving_cylinder_to_set');
  await knex.schema.dropTableIfExists('diving_cylinder_set');
  await knex.schema.dropTableIfExists('diving_cylinder');
}
