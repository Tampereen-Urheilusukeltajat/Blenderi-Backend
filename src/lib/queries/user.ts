import { Knex } from 'knex';
import snakecaseKeys from 'snakecase-keys';
import { knexController } from '../../database/database';
import { User, UserResponse } from '../../types/user.types';

export const selectNotArchivedUsers = async (): Promise<UserResponse[]> => {
  const users = await knexController<User>('user')
    .whereNull('deleted_at')
    .whereNull('archived_at')
    .select(
      'id',
      'email',
      'phone',
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender',
      'archived_at as archivedAt'
    );
  return users;
};

export const selectUsers = async (): Promise<UserResponse[]> => {
  const users = await knexController<User>('user')
    .whereNull('deleted_at')
    .select(
      'id',
      'email',
      'phone',
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender',
      'archived_at as archivedAt'
    );
  return users;
};

export const getUserWithId = async (
  userId: string,
  trx?: Knex.Transaction
): Promise<UserResponse | undefined> => {
  const transaction = trx ?? knexController;
  const res = await transaction
    .select(
      'id',
      'email',
      'phone',
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender',
      'archived_at as archivedAt'
    )
    .from('user')
    .where({ id: userId });

  return { ...res[0] };
};

export const updateUser = async (
  userId: string,
  payload: Partial<User>,
  trx?: Knex.Transaction
): Promise<UserResponse> => {
  const transaction = trx ?? (await knexController.transaction());

  await transaction('user')
    .where({ id: userId, deleted_at: null })
    .update(snakecaseKeys(payload));

  const editedUser = await getUserWithId(userId, transaction);

  if (!editedUser) throw new Error('Updated user not found');

  await transaction.commit();
  return editedUser;
};

export const updateLastLogin = async (
  userId: string,
  trx?: Knex.Transaction
): Promise<void> => {
  const transaction = trx ?? knexController;

  const alteredRows = await transaction('user')
    .where({ id: userId })
    .update({ last_login: new Date(Date.now()) });

  if (alteredRows !== 1) throw new Error('Updating last login failed');
};
