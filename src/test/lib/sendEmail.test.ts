import '../../lib/testUtils';
import { describe, test, expect } from '@jest/globals';
import sendEmail from '../../lib/sendEmail';
import { emailMsg } from '../../types/email.types';

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
