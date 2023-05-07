import { Knex } from 'knex';
import snakecaseKeys from 'snakecase-keys';
import { knexController } from '../../database/database';
import { User, UserResponse } from '../../types/user.types';

type UserLoginResponse = Pick<
  User,
  | 'id'
  | 'isAdmin'
  | 'isAdvancedBlender'
  | 'isBlender'
  | 'isInstructor'
  | 'salt'
  | 'passwordHash'
  | 'archivedAt'
>;

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
          u.phone_number AS phoneNumber,
          u.forename,
          u.surname,
          IF(arl.phone_number IS NULL, 0, 1) AS isMember,
          arl.is_admin AS isAdmin,
          arl.is_advanced_blender AS isAdvancedBlender,
          arl.is_blender AS isBlender,
          arl.is_instructor AS isInstructor
        FROM user u
        LEFT JOIN access_role_list arl ON u.phone_number = arl.phone_number
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
  const res = await getUsers(transaction, true, userId);

  return { ...res[0][0] };
};

export const getUserDetailsForLogin = async (
  email: string
): Promise<UserLoginResponse | undefined> => {
  const res = await knexController.raw<UserLoginResponse[]>(
    `
        SELECT
          u.id,
          u.salt,
          u.password_hash AS passwordHash,
          u.archived_at AS archivedAt,
          IF(arl.phone_number IS NULL, 0, 1) AS isMember,
          arl.is_admin AS isAdmin,
          arl.is_advanced_blender AS isAdvancedBlender,
          arl.is_blender AS isBlender,
          arl.is_instructor AS isInstructor
        FROM user u
        LEFT JOIN access_role_list arl ON u.phone_number = arl.phone_number
        WHERE 
          deleted_at IS NULL AND
          archived_at IS NULL AND
          u.email = :email
    `,
    {
      email,
    }
  );

  return { ...res[0][0] };
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
