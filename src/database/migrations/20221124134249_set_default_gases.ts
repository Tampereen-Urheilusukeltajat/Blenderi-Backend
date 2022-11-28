import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('gas').insert({ name: 'Air' });
  await knex('gas').insert({ name: 'Helium' });
  await knex('gas').insert({ name: 'Oxygen' });
  await knex('gas').insert({ name: 'Argon' });
  await knex('gas').insert({ name: 'Diluent' });
}

export async function down(knex: Knex): Promise<void> {
  await knex('gas').del();
}
