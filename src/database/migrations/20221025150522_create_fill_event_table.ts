import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('fill_event', (table) => {
    table.increments('id');
    table.uuid('user').references('id').inTable('user').notNullable();
    table
      .uuid('cylinder_set')
      .references('id')
      .inTable('diving_cylinder_set')
      .notNullable();
    table.string('info', 2048); // arbitrary number
    table.timestamps(true, true);
  });

  await knex.schema.createTable('fill_cylinder_event', (table) => {
    table
      .increments('fill_event')
      .references('id')
      .inTable('fill_event')
      .notNullable();
    table
      .uuid('cylinder')
      .references('id')
      .inTable('diving_cylinder')
      .notNullable();
    table
      .string('gas', 15)
      .checkIn(['pressurized_air', 'oxygen', 'helium', 'argon'])
      .notNullable();
    table.integer('fill_pressure').unsigned().notNullable();
    table.integer('cost').unsigned().notNullable(); // cost in euro cents
    table.unique(['fill_event', 'cylinder']);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('fill_cylinder_event');
  await knex.schema.dropTable('fill_event');
}
