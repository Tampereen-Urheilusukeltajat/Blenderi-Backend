import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
      CREATE TABLE invoice (
        id UUID PRIMARY KEY DEFAULT UUID(),
        payment_event_id UUID REFERENCES payment_event (id),
        created_by CHAR(36) REFERENCES user (id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      );
    `);
}

export async function down(knex: Knex): Promise<void> {
  // noop
}
