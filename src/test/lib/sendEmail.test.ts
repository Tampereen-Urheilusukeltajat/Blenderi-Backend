import '../../lib/utils/testUtils';
import { describe, test, expect } from '@jest/globals';
import { emailMsg } from '../../types/email.types';
import { sendEmail } from '../../lib/utils/sendEmail';

describe('send Email', () => {
  test('happy path', async () => {
    const msg: emailMsg = {
      to: 'example@example.org',
      subject: 'sendGrid-test',
      text: 'lorem ipsum',
    };

    await expect(sendEmail(msg)).resolves.toBeUndefined();
  });

  test('unhappy path', async () => {
    const msg: emailMsg = {
      to: 'invalid',
      subject: '',
      text: 'lorem ipsum',
    };

    await expect(sendEmail(msg)).rejects.toBeInstanceOf(Error);
  });
});
