import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
  ALTER TABLE diving_cylinder
  MODIFY volume FLOAT(6,2) NOT NULL;
`);
}

export async function down(knex: Knex): Promise<void> {
  // noop
}
