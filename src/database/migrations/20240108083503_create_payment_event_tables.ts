import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
	CREATE TABLE payment_event (
		id UUID PRIMARY KEY DEFAULT UUID(),
		user_id CHAR(36) REFERENCES user (id),
		status ENUM('CREATED', 'IN_PROGRESS', 'FAILED', 'COMPLETED') NOT NULL DEFAULT 'CREATED',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	)
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
	CREATE TABLE stripe_payment_intent (
		id INTEGER AUTO_INCREMENT PRIMARY KEY,
		payment_event_id UUID NOT NULL REFERENCES payment_event (id),
		payment_intent_id VARCHAR(255) NOT NULL,
		amount_eur_cents INT UNSIGNED NOT NULL,
		client_secret VARCHAR(255) NOT NULL,
		status VARCHAR(255),
		payment_method VARCHAR(255),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	)
	`);

  await knex.raw(`
  CREATE TABLE stripe_dispute (
		id INTEGER AUTO_INCREMENT PRIMARY KEY,
		stripe_payment_intent_id INTEGER NOT NULL REFERENCES stripe_payment_intent (id),
		status VARCHAR(255),
		reason VARCHAR(255),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	)
  `);
}

export async function down(): Promise<void> {
  // noop
}
