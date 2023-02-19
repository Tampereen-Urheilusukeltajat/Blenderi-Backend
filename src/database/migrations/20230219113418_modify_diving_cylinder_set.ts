import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE diving_cylinder_set
    ADD archived BOOLEAN DEFAULT 0;
  `);
}

export async function down(): Promise<void> {
  // noop
}
