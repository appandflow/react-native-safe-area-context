import { jest } from '@jest/globals';
import React, { useContext } from 'react';
import type {
  EdgeInsets,
  InsetChangedEvent,
  Metrics,
  NativeSafeAreaViewInstance,
  NativeSafeAreaViewProps,
  Rect,
} from '../SafeArea.types';
import type {
  SafeAreaListenerProps,
  SafeAreaProviderProps,
  WithSafeAreaInsetsProps,
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

const SafeAreaInsetsContext = React.createContext<EdgeInsets | null>(null);
const SafeAreaFrameContext = React.createContext<Rect | null>(null);

const useSafeAreaInsets = jest.fn(() => {
  return useContext(SafeAreaInsetsContext) ?? MOCK_INITIAL_METRICS.insets;
});

const useSafeAreaFrame = jest.fn(() => {
  return useContext(SafeAreaFrameContext) ?? MOCK_INITIAL_METRICS.frame;
});

const SafeAreaProvider = ({
  children,
  initialMetrics,
}: SafeAreaProviderProps) => {
  return (
    <SafeAreaFrameContext.Provider
      value={initialMetrics?.frame ?? MOCK_INITIAL_METRICS.frame}
    >
      <SafeAreaInsetsContext.Provider
        value={initialMetrics?.insets ?? MOCK_INITIAL_METRICS.insets}
      >
        {children}
      </SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  );
};

const SafeAreaListener = ({
  children,
  onChange,
  ...props
}: SafeAreaListenerProps) => {
  return React.createElement(
    'RNCSafeAreaProvider',
    {
      ...props,
      onInsetsChange: ({ nativeEvent }: InsetChangedEvent) =>
        onChange(nativeEvent),
    },
    children,
  );
};

const SafeAreaView = React.forwardRef<
  NativeSafeAreaViewInstance,
  NativeSafeAreaViewProps
>((props, ref) => {
  return React.createElement('RNCSafeAreaView', { ...props, ref });
});

const withSafeAreaInsets = <T,>(
  WrappedComponent: React.ComponentType<
    (React.PropsWithoutRef<T> | T) & WithSafeAreaInsetsProps
  >,
) =>
  React.forwardRef<unknown, T>((props, ref) => {
    const insets = useSafeAreaInsets();
    return <WrappedComponent {...props} insets={insets} ref={ref} />;
  });

export default {
  SafeAreaInsetsContext,
  SafeAreaFrameContext,
  SafeAreaProvider,
  SafeAreaListener,
  SafeAreaView,
  SafeAreaConsumer: SafeAreaInsetsContext.Consumer,
  SafeAreaContext: SafeAreaInsetsContext,
  initialWindowMetrics: MOCK_INITIAL_METRICS,
  initialWindowSafeAreaInsets: null,
  useSafeAreaInsets,
  useSafeAreaFrame,
  useSafeArea: useSafeAreaInsets,
  withSafeAreaInsets,
};
