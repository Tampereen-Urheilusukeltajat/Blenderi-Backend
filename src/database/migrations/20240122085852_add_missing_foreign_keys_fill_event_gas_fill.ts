import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE fill_event_gas_fill
    ADD FOREIGN KEY (fill_event_id) REFERENCES fill_event(id)
  `);

  await knex.raw(`
    ALTER TABLE fill_event_gas_fill
    ADD FOREIGN KEY (gas_price_id) REFERENCES gas_price(id)
  `);

  await knex.raw(`
    ALTER TABLE fill_event_gas_fill
    ADD FOREIGN KEY (storage_cylinder_id) REFERENCES storage_cylinder(id)
  `);
}

export async function down(): Promise<void> {
  // noop
}
