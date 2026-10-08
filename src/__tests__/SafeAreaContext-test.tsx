import { describe, expect, it, jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { View } from 'react-native';
import type { Metrics } from '../SafeArea.types';
import {
  SafeAreaProvider,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from '../SafeAreaContext';

const TEST_METRICS_1: Metrics = {
  insets: { top: 1, left: 2, right: 3, bottom: 4 },
  frame: { x: 0, y: 0, height: 100, width: 100 },
};
const TEST_METRICS_2: Metrics = {
  insets: { top: 2, left: 3, right: 4, bottom: 5 },
  frame: { x: 0, y: 0, width: 10, height: 16 },
};

const PrintInsetsTestView = () => {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingBottom: insets.bottom,
        paddingRight: insets.right,
        top: frame.y,
        left: frame.y,
        width: frame.width,
        height: frame.height,
      }}
    />
  );
};

describe('SafeAreaContext', () => {
  it('renders', () => {
    const { toJSON } = render(<SafeAreaProvider />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('does not render child until inset values are received', () => {
    const { toJSON } = render(
      <SafeAreaProvider>
        <PrintInsetsTestView />
      </SafeAreaProvider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders child when inset values are received', async () => {
    const { toJSON } = render(
      <SafeAreaProvider testID="safe-area-provider">
        <PrintInsetsTestView />
      </SafeAreaProvider>,
    );
    expect(toJSON()).toMatchSnapshot();
    const element = await screen.findByTestId('safe-area-provider');
    act(() => {
      // The prop name on the host element depends on whether insets come from
      // the core `onSafeAreaInsetsChange` view prop or the native provider.
      const onInsetsChange =
        element.props.onSafeAreaInsetsChange ?? element.props.onInsetsChange;
      onInsetsChange({
        nativeEvent: TEST_METRICS_1,
      });
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('supports setting initial insets', () => {
    const { toJSON } = render(
      <SafeAreaProvider initialMetrics={TEST_METRICS_1}>
        <PrintInsetsTestView />
      </SafeAreaProvider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('uses parent insets when available', () => {
    const { toJSON } = render(
      <SafeAreaProvider initialMetrics={TEST_METRICS_1}>
        <SafeAreaProvider>
          <PrintInsetsTestView />
        </SafeAreaProvider>
      </SafeAreaProvider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('uses inner insets', () => {
    const { toJSON } = render(
      <SafeAreaProvider initialMetrics={TEST_METRICS_1}>
        <SafeAreaProvider initialMetrics={TEST_METRICS_2}>
          <PrintInsetsTestView />
        </SafeAreaProvider>
      </SafeAreaProvider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('throws when no provider is rendered', () => {
    // Silence the React error boundary warning; we expect an uncaught error.
    const consoleErrorMock = jest
      .spyOn(console, 'error')
      .mockImplementation((message) => {
        if (message.startsWith('The above error occured in the ')) {
          return;
        }
      });
    expect(() => {
      render(<PrintInsetsTestView />);
    }).toThrow(
      'No safe area value available. Make sure you are rendering `<SafeAreaProvider>` at the top of your app.',
    );

    consoleErrorMock.mockRestore();
  });
});
