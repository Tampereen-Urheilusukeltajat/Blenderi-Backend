import { knexController } from '../../database/database';
import { type User } from '../../types/user.types';

/* 
Return true if given phone number already in database.
False if not or it's linked to given id. 
*/
export const phoneAlreadyExists = async (
  newPhone: string,
  userID?: string,
): Promise<boolean> => {
  const count: number = await knexController('user')
    .count('phone_number')
    .where('phone_number', newPhone)
    .first()
    .then((row: { 'count(`phone_number`)': number }) =>
      Number(row['count(`phone_number`)']),
    );

  if (userID !== undefined) {
    const userPhone = await knexController<User>('user')
      .select('phone_number')
      .where('id', userID);

    if (userPhone[0].phone_number === newPhone) {
      return false;
    }
  }

  return count !== 0;
};

/* 
Return true if given email already in database. 
False if not or it's linked to given id.
*/
export const emailAlreadyExists = async (
  newEmail: string,
  userID?: string,
): Promise<boolean> => {
  const count: number = await knexController<User>('user')
    .count('email')
    .where('email', newEmail)
    .first()
    .then((row: { 'count(`email`)': number }) => Number(row['count(`email`)']));

  if (userID !== undefined) {
    const userEmail = await knexController<User>('user')
      .select('email')
      .where('id', userID);

    if (userEmail[0].email === newEmail) {
      return false;
    }
  }

  return count !== 0;
};
