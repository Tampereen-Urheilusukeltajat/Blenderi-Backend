import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE user
    RENAME COLUMN phone TO phone_number;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // noop
}
