import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user', (table) => {
    table.uuid('id').defaultTo(knex.raw('UUID()')).primary();
    table.string('email', 254); // https://www.rfc-editor.org/errata_search.php?rfc=3696
    table.string('forename', 255);
    table.string('surname', 255);
    table.boolean('is_admin').notNullable();
    table.boolean('is_blender').notNullable();
    table.string('salt', 128).notNullable();
    table.string('password_hash', 255).notNullable();
    table.dateTime('archived_at', { useTz: false });
    table.dateTime('deleted_at', { useTz: false });
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user');
}
