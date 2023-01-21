import { describe, test, expect } from '@jest/globals';
import { hashPassword } from '../../lib/auth/auth';

describe('Hash password', () => {
  test('hash is not plain password', async () => {
    const testPass = 'testpass123';
    const hashObj = await hashPassword(testPass);

    // bcrpyt hash should always 60 characters long.
    const hashLength = hashObj.hash.length;
    expect(hashLength).toEqual(60);

    expect(hashObj.hash).not.toEqual(testPass);
    expect(hashObj.hash).not.toEqual(undefined);
    expect(hashObj.salt).not.toEqual(undefined);
  });
});
