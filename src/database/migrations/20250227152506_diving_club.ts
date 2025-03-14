import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('diving_club', (table) => {
    table.uuid('id').defaultTo(knex.raw('UUID()')).primary();
    table.string('name', 255).notNullable();
    table.string('abbreviation', 255).nullable();
    table.string('description', 255).nullable();
    table.timestamps(true, true);
  });

  await knex.schema.alterTable('user', (table) => {
    table.uuid('diving_club_id').references('id').inTable('diving_club');
  });

  await knex.schema.alterTable('diving_cylinder_set', (table) => {
    table
      .uuid('diving_club_owner_id')
      .nullable()
      .references('id')
      .inTable('diving_club');
    table.uuid('owner').nullable().alter();
  });

  await knex.raw(`
    ALTER TABLE diving_cylinder_set
    ADD CONSTRAINT diving_cylinder_set_owner_check
    CHECK (owner IS NOT NULL OR diving_club_owner_id IS NOT NULL)
  `);
}

export async function down(knex: Knex): Promise<void> {
  // noop
}
