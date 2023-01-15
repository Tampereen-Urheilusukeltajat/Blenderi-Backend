import { jest, expect } from '@jest/globals';

export default {
  setApiKey: jest.fn((key): void => {
    expect(key).toBeTruthy();
  }),

  send(data): object[] {
    if (data.to === 'invalid') {
      return [{ statusCode: 500 }];
    }
    return [{ statusCode: 202 }];
  },
};
