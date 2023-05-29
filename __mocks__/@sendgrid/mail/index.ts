import { jest, expect } from '@jest/globals';

type WaitForMeMock = jest.Mock & {
  waitUntilComplete: () => Promise<void>;
};

export const waitForMeFactory = (): WaitForMeMock => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  let _resolve: Function;
  const promise = new Promise<void>((resolve) => (_resolve = resolve));

  const mock = jest.fn(() => {
    _resolve();
  }) as WaitForMeMock; // force casting

  mock.waitUntilComplete = async () => promise;

  return mock;
};

let message: undefined | string;
let globalWaiter: WaitForMeMock;

export default {
  setApiKey: jest.fn((key): void => {
    expect(key).toBeTruthy();
  }),

  send(data): object[] {
    if (data.to === 'invalid') {
      return [{ statusCode: 500 }];
    }

    message = data.text;

    if (globalWaiter !== undefined) {
      globalWaiter();
    }

    return [{ statusCode: 202 }];
  },

  setMailWaiter(): void {
    globalWaiter = waitForMeFactory();
  },

  async getMessage(): Promise<string> {
    await globalWaiter.waitUntilComplete();
    if (message === undefined) throw Error('Email mock is broken');
    return message;
  },
};
