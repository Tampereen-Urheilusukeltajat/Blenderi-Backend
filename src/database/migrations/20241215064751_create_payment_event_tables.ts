import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE payment_event (
      id UUID PRIMARY KEY DEFAULT UUID(),
      user_id CHAR(36) REFERENCES user (id),
      status ENUM('CREATED', 'IN_PROGRESS', 'FAILED', 'COMPLETED') NOT NULL DEFAULT 'CREATED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      total_amount_eur_cents INT UNSIGNED NOT NULL DEFAULT 0
    );
    `);

  await knex.raw(`
    CREATE TABLE fill_event_payment_event (
      payment_event_id UUID REFERENCES payment_event (id),
      fill_event_id INT UNSIGNED REFERENCES fill_event (id),
      PRIMARY KEY(payment_event_id, fill_event_id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    `);

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

export async function down(knex: Knex): Promise<void> {
  // noop
}
