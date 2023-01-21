import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (
  password: string
): Promise<{ hash: string; salt: string }> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);

  return { hash, salt };
};

export const passwordIsValid = async (
  password: string,
  expectedHash: string
): Promise<boolean> => bcrypt.compare(password, expectedHash);
