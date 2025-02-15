import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
      ALTER TABLE user 
        ADD COLUMN is_user BOOLEAN NOT NULL DEFAULT 0;
    `);
}

export async function down(): Promise<void> {
  // noop
}
