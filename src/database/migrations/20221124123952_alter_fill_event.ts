import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('prices');
  await knex.schema.dropTableIfExists('fill_event');
  await knex.schema.dropTableIfExists('fill_event_gas_fill');
  await knex.schema.dropTableIfExists('storage_cylinder');
  await knex.schema.dropTableIfExists('gas_price');
  await knex.schema.dropTableIfExists('gas');

  await knex.schema.createTable('fill_event', (table) => {
    table.increments('id').unsigned().primary();
    table.uuid('user_id').references('id').inTable('user').notNullable();
    table
      .uuid('cylinder_set_id')
      .references('id')
      .inTable('diving_cylinder_set');
    table.string('gas_mixture', 128).notNullable(); // magic number
    table.string('description', 1024); // magic number
    table.timestamps(true, true);
  });

  await knex.schema.createTable('gas', (table) => {
    table.increments('id').unsigned().primary();
    table.string('name', 128).notNullable();
    table.timestamps(true, true);
  });

  /**
   * There can only be one active price for one gas.
   * When inserting, you must check that there is no overlap in active times
   * ie. you must update active_to-field of the previous price.
   */
  await knex.schema.createTable('gas_price', (table) => {
    table.increments('id').unsigned().primary();
    table
      .integer('gas_id', 10)
      .unsigned()
      .references('id')
      .inTable('gas')
      .notNullable();
    table.integer('price_eur_cents').unsigned().notNullable();
    table.datetime('active_from').notNullable();
    table.datetime('active_to').defaultTo('9999-12-31 23:59:59'); // helps with check constraints (=no null values)
    table.check('?? > ??', ['active_to', 'active_from']);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('storage_cylinder', (table) => {
    table.increments('id').unsigned().primary();
    table
      .integer('gas_id', 10)
      .unsigned()
      .references('id')
      .inTable('gas')
      .notNullable();
    table.float('volume').unsigned().notNullable();
    table.float('max_pressure').unsigned().notNullable();
    table.string('name', 256).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('fill_event_gas_fill', (table) => {
    table
      .integer('fill_event_id', 10)
      .unsigned()
      .references('id')
      .inTable('fill_event')
      .notNullable();
    table
      .integer('storage_cylinder_id', 10)
      .unsigned()
      .references('id')
      .inTable('storage_cylinder');
    table.float('volume_litres').unsigned();
    table
      .integer('gas_price_id', 10)
      .unsigned()
      .references('id')
      .inTable('gas_price')
      .notNullable();
    table.timestamps(true, true);
    table.primary(['fill_event_id', 'gas_price_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // not implemented
}
