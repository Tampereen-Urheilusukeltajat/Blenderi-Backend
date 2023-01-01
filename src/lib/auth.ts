import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = (
  password: string
): { hash: string; salt: string } => {
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  const hash = bcrypt.hashSync(password, salt);

  return { hash, salt };
};

export const passwordIsValid = (
  password: string,
  expectedHash: string
): boolean => bcrypt.compareSync(password, expectedHash);
