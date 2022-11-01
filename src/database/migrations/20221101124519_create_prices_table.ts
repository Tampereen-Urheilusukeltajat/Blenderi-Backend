import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('prices', (table) => {
    table.enu('gas', ['oxygen', 'helium', 'argon']).notNullable();
    table.integer('price').unsigned().notNullable(); // euro cents per ?? cost per litre? cost per storage tank bar????
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('prices');
}
