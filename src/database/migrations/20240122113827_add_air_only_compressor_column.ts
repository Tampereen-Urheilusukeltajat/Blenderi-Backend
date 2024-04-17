import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE compressor
    ADD COLUMN air_only BOOLEAN DEFAULT 1 NOT NULL
  `);
}

export async function down(): Promise<void> {
  // noop
}
