import { knexController } from '../database/database';
import { User, UserResponse } from '../types/user.types';

export const selectNotArchivedUsers = async (): Promise<UserResponse[]> => {
  const users = await knexController<User>('user')
    .whereNull('deleted_at')
    .whereNull('archived_at')
    .select(
      'id',
      'email',
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
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender',
      'archived_at as archivedAt'
    );
  return users;
};
