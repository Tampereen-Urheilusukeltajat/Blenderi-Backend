import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (
  password: string
): Promise<{ hash: string; salt: string }> => {
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  const hash = bcrypt.hashSync(password, salt);

  return { hash, salt };
};

export const passwordIsValid = async (
  password: string,
  expectedHash: string,
  salt: string
): Promise<boolean> => bcrypt.hashSync(password, salt) === expectedHash;
