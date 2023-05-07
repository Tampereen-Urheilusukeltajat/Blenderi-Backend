import { Knex } from 'knex';
import snakecaseKeys from 'snakecase-keys';
import { knexController } from '../../database/database';
import { User, UserResponse } from '../../types/user.types';

const getUsers = async (
  db: Knex | Knex.Transaction,
  onlyActiveUsers: boolean,
  userId?: string
): Promise<UserResponse[]> => {
  return db.raw<UserResponse[]>(
    `
        SELECT
          u.id,
          u.email,
          u.phone,
          u.forename,
          u.surname,
          ial.is_admin AS isAdmin,
          ial.is_advanced_blender AS isAdvancedBlender,
          ial.is_blender AS isBlender,
          ial.is_instructior AS isInstructor
        FROM user u
        JOIN access_role_list arl ON u.phone = arl.phone_number
        WHERE 
        deleted_at IS NULL
        ${onlyActiveUsers ? 'AND archived_at IS NULL' : ''}
        ${userId ? 'AND u.id = :userId' : ''}
    `,
    {
      userId,
    }
  );
};

export const selectNotArchivedUsers = async (): Promise<UserResponse[]> => {
  return getUsers(knexController, false);
};

export const selectUsers = async (): Promise<UserResponse[]> => {
  return getUsers(knexController, true);
};

export const getUserWithId = async (
  userId: string,
  trx?: Knex.Transaction
): Promise<UserResponse | undefined> => {
  const transaction = trx ?? knexController;
  const res = getUsers(transaction, true, userId);

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
