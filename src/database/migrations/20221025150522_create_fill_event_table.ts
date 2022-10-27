import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('fill_event', (table) => {
    table.uuid('id').primary();
    table.uuid('user').references('id').inTable('user').notNullable();
    table
      .uuid('cylinder_set')
      .references('id')
      .inTable('diving_cylinder_set')
      .notNullable();
    table.integer('air_pressure').unsigned().notNullable().defaultTo(0);
    table.integer('oxygen_pressure').unsigned().notNullable().defaultTo(0);
    table.integer('helium_pressure').unsigned().notNullable().defaultTo(0);
    table.integer('argon_pressure').unsigned().notNullable().defaultTo(0);
    table.integer('diluent_pressure').unsigned().notNullable().defaultTo(0);
    table.integer('price').unsigned(); // euro cents
    table.string('info', 1024); // arbitrary number
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('fill_event');
}
