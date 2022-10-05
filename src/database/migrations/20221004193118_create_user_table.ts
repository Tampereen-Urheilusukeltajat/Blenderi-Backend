import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user', (table) => {
    table.increments('id');
    table
      .string('email', 254) // https://www.rfc-editor.org/errata_search.php?rfc=3696
      .notNullable();
    table.string('forename', 255).notNullable();
    table.string('surname', 255).notNullable();
    table.boolean('admin').notNullable();
    table.boolean('blender').notNullable();
    table.string('salt', 128).notNullable();
    table.string('password_hash', 255).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user');
}
