import { expect, it, jest } from '@jest/globals';

jest.mock('react-native', () => {
  throw new Error('The React Native runtime should not be evaluated');
});

it('loads without evaluating the React Native runtime', () => {
  expect(() => require('../jest/mock')).not.toThrow();
});
