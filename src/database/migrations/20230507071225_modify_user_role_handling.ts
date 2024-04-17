import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE user
    DROP COLUMN IF EXISTS is_blender;
  `);

  await knex.raw(`
    ALTER TABLE user
    DROP COLUMN IF EXISTS is_admin;
  `);

  await knex.raw(`
    RENAME TABLE IF EXISTS initial_blender_access_list TO access_role_list;
  `);

  await knex.raw(`
    ALTER TABLE access_role_list
    ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0;
  `);

  await knex.raw(`
    ALTER TABLE access_role_list
    ADD COLUMN is_advanced_blender BOOLEAN NOT NULL DEFAULT 0;
    `);

  await knex.raw(`
    ALTER TABLE access_role_list
    ADD COLUMN is_blender BOOLEAN NOT NULL DEFAULT 0;

    `);

  await knex.raw(`
    ALTER TABLE access_role_list
    ADD COLUMN is_instructor BOOLEAN NOT NULL DEFAULT 0;
    `);
}

export async function down(knex: Knex): Promise<void> {
  // noop
}
