import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('diving_cylinder_set', (table) => {
    table.dropForeign('owner');
  });

  await knex.schema.table('diving_cylinder_set', (table) => {
    table.dropUnique(['owner', 'name']);
  });

  await knex.schema.table('diving_cylinder_set', (table) => {
    table
      .foreign('owner', 'fk_diving_cylinder_set_user')
      .references('id')
      .inTable('user');
  });
}

export async function down(): Promise<void> {
  // noop
}
