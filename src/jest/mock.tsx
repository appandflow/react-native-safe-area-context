import { jest } from '@jest/globals';
import React, { useContext } from 'react';
import type { Metrics } from '../SafeArea.types';
import type {
  SafeAreaProviderProps,
  SafeAreaInsetsContext,
  SafeAreaFrameContext,
} from '../SafeAreaContext';

const MOCK_INITIAL_METRICS: Metrics = {
  frame: {
    width: 320,
    height: 640,
    x: 0,
    y: 0,
  },
  insets: {
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
};

const RNSafeAreaContext = jest.requireActual<{
  SafeAreaInsetsContext: typeof SafeAreaInsetsContext;
  SafeAreaFrameContext: typeof SafeAreaFrameContext;
}>('react-native-safe-area-context');

// `jest.resetAllMocks()`, which apps commonly call from a global `beforeEach`,
// strips the implementation off every mock function. That would make these
// hooks return `undefined` and break every component reading insets or frame.
// Reinstall the default implementation when it has been stripped, so the hooks
// keep working while tests can still override them with `mockReturnValue` and
// friends.
function mockHook<T extends (...args: never[]) => unknown>(implementation: T) {
  const hook = jest.fn(implementation);
  return new Proxy(hook, {
    apply(target, thisArg, args) {
      if (target.getMockImplementation() == null) {
        target.mockImplementation(implementation);
      }
      return Reflect.apply(target, thisArg, args);
    },
  });
}

export default {
  ...RNSafeAreaContext,
  initialWindowMetrics: MOCK_INITIAL_METRICS,
  useSafeAreaInsets: mockHook(() => {
    return (
      useContext(RNSafeAreaContext.SafeAreaInsetsContext) ??
      MOCK_INITIAL_METRICS.insets
    );
  }),
  useSafeAreaFrame: mockHook(() => {
    return (
      useContext(RNSafeAreaContext.SafeAreaFrameContext) ??
      MOCK_INITIAL_METRICS.frame
    );
  }),
  // Provide a simpler implementation with default values.
  SafeAreaProvider: ({ children, initialMetrics }: SafeAreaProviderProps) => {
    return (
      <RNSafeAreaContext.SafeAreaFrameContext.Provider
        value={initialMetrics?.frame ?? MOCK_INITIAL_METRICS.frame}
      >
        <RNSafeAreaContext.SafeAreaInsetsContext.Provider
          value={initialMetrics?.insets ?? MOCK_INITIAL_METRICS.insets}
        >
          {children}
        </RNSafeAreaContext.SafeAreaInsetsContext.Provider>
      </RNSafeAreaContext.SafeAreaFrameContext.Provider>
    );
  },
};
