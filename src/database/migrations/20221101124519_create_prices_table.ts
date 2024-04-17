import { type Knex } from 'knex';
/* 
  Used currency is euros (€) and the price is saved in euro cents per litre of gas (100 cents = 1 €).
*/
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('prices', (table) => {
    table.enu('gas', ['oxygen', 'helium', 'argon']).notNullable();
    table.integer('price_per_litre_in_eur_cents').unsigned().notNullable();
    table.uuid('admin').references('id').inTable('user').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('prices');
}
