import { type Knex } from 'knex';
import snakecaseKeys from 'snakecase-keys';
import { knexController } from '../../database/database';
import {
  type UserRoles,
  type User,
  type UserResponse,
} from '../../types/user.types';
import { type DBResponse } from '../../types/general.types';

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
  | 'isUser'
  | 'forename'
  | 'surname'
>;

const getUsers = async (
  db: Knex | Knex.Transaction,
  onlyActiveUsers: boolean,
  userId?: string,
  email?: string,
): Promise<DBResponse<UserResponse[]>> => {
  const sql = `
    SELECT
      u.id,
      u.email,
      u.phone_number AS phoneNumber,
      u.forename,
      u.surname,
      u.is_user AS isUser,
      u.is_admin AS isAdmin,
      u.is_advanced_blender AS isAdvancedBlender,
      u.is_blender AS isBlender,
      u.is_instructor AS isInstructor
    FROM user u
    WHERE 
      deleted_at IS NULL
      ${onlyActiveUsers ? 'AND archived_at IS NULL' : ''}
      ${userId ? 'AND u.id = :userId' : ''}
      ${email ? 'AND u.email = :email' : ''}
  `;

  return db.raw<DBResponse<UserResponse[]>>(sql, {
    userId,
    email,
  });
};

export const selectActiveUsers = async (): Promise<UserResponse[]> => {
  const res = await getUsers(knexController, true);
  return [...res[0]];
};

export const selectUsers = async (): Promise<UserResponse[]> => {
  const res = await getUsers(knexController, false);
  return [...res[0]];
};

export const getUserWithId = async (
  userId: string,
  onlyActive = true,
  trx?: Knex.Transaction,
): Promise<UserResponse | undefined> => {
  const db = trx ?? knexController;
  const usersRes = await getUsers(db, onlyActive, userId);

  return usersRes[0].find((user) => user.id === userId);
};

export const getUserWithEmail = async (
  email: string,
  onlyActive = true,
  trx?: Knex.Transaction,
): Promise<UserResponse | undefined> => {
  const db = trx ?? knexController;
  const res = await getUsers(db, onlyActive, undefined, email);

  return { ...res[0][0] };
};

/**
 * Only returns active users (archived_at and deleted_at are null)
 * @param email
 * @returns
 */
export const getUserDetailsForLogin = async (
  email: string,
): Promise<UserLoginResponse | undefined> => {
  const res = await knexController.raw<UserLoginResponse[]>(
    `
        SELECT
          u.id,
          u.salt,
          u.password_hash AS passwordHash,
          u.archived_at AS archivedAt,
          u.is_user AS isUser,
          u.forename,
          u.surname,
          u.is_admin AS isAdmin,
          u.is_advanced_blender AS isAdvancedBlender,
          u.is_blender AS isBlender,
          u.is_instructor AS isInstructor
        FROM user u
        WHERE 
          deleted_at IS NULL AND
          archived_at IS NULL AND
          u.email = :email
    `,
    {
      email,
    },
  );

  return { ...res[0][0] };
};

export const updateUser = async (
  userId: string,
  payload: Partial<User>,
  trx?: Knex.Transaction,
): Promise<UserResponse> => {
  const db = trx ?? (await knexController.transaction());

  await db('user')
    .where({ id: userId, deleted_at: null })
    .update(snakecaseKeys(payload));

  const editedUser = await getUserWithId(userId, false, db);

  if (!editedUser) throw new Error('Updated user not found');

  await db.commit();
  return editedUser;
};

export const updateLastLogin = async (
  userId: string,
  trx?: Knex.Transaction,
): Promise<void> => {
  const db = trx ?? knexController;

  const alteredRows = await db('user')
    .where({ id: userId })
    .update({ last_login: new Date(Date.now()) });

  if (alteredRows !== 1) throw new Error('Updating last login failed');
};

export const updateUsersRoles = async (
  userId: string,
  payload: Partial<UserRoles>,
  trx?: Knex.Transaction,
): Promise<UserResponse> => {
  const db = trx ?? (await knexController.transaction());

  await db('user').where('id', '=', userId).update({
    is_admin: payload.isAdmin,
    is_blender: payload.isBlender,
    is_user: payload.isUser,
    is_instructor: payload.isInstructor,
    is_advanced_blender: payload.isAdvancedBlender,
  });

  const editedUser = await getUserWithId(userId, false, db);

  if (!editedUser) throw new Error('Updated user not found');

  await db.commit();
  return editedUser;
};
