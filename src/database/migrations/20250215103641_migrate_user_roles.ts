import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
      ALTER TABLE user
        ADD COLUMN IF NOT EXISTS is_admin BIT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_blender BIT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_instructor BIT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_advanced_blender BIT NOT NULL DEFAULT 0;
    `);

  await knex.raw(`
      UPDATE user
      JOIN access_role_list arl ON user.phone_number = arl.phone_number
      SET 
        user.is_admin = arl.is_admin,
        user.is_blender = arl.is_blender,
        user.is_instructor = arl.is_instructor,
        user.is_advanced_blender = arl.is_advanced_blender;
    `);

  await knex.schema.dropTableIfExists('access_role_list');
}

export async function down(knex: Knex): Promise<void> {
  // noop
}
