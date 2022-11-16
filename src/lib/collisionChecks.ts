import { knexController } from '../database/database';
import { User } from '../types/user.types';

export const phoneAlreadyExists = async (phone: string): Promise<boolean> => {
  const count: number = await knexController<User>('user')
    .count('phone')
    .where('phone', phone)
    .first()
    .then((row: { 'count(`phone`)': number }) => Number(row['count(`phone`)']));
  return count !== 0;
};

export const emailAlreadyExists = async (email: string): Promise<boolean> => {
  const count: number = await knexController<User>('user')
    .count('email')
    .where('email', email)
    .first()
    .then((row: { 'count(`email`)': number }) => Number(row['count(`email`)']));
  return count !== 0;
};
