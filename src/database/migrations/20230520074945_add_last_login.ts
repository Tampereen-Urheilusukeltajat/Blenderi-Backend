import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE user
    ADD COLUMN last_login datetime NOT NULL DEFAULT NOW();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // noop
}
