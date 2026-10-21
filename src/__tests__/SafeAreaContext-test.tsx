import { describe, expect, it, jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { Text, View } from 'react-native';
import type { CornerAdaptation, Metrics } from '../SafeArea.types';
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

const TEST_CORNER_METRICS: Metrics = {
  insets: { top: 0, left: 0, right: 84, bottom: 34 },
  verticalCornerAdaptedInsets: { top: 17, left: 0, right: 84, bottom: 34 },
  horizontalCornerAdaptedInsets: { top: 0, left: 2, right: 84, bottom: 34 },
  frame: { x: 0, y: 0, height: 678, width: 466 },
};

const PrintCornerInsets = ({
  cornerAdaptation,
  onRender,
}: {
  cornerAdaptation?: CornerAdaptation;
  onRender?: () => void;
}) => {
  const insets = useSafeAreaInsets(
    cornerAdaptation ? { cornerAdaptation } : undefined,
  );
  onRender?.();
  return (
    <Text testID={`insets-${cornerAdaptation ?? 'none'}`}>
      {JSON.stringify(insets)}
    </Text>
  );
};

const PrintAllCornerInsets = () => (
  <>
    <PrintCornerInsets />
    <PrintCornerInsets cornerAdaptation="vertical" />
    <PrintCornerInsets cornerAdaptation="horizontal" />
  </>
);

function readInsets(cornerAdaptation?: CornerAdaptation) {
  return JSON.parse(
    screen.getByTestId(`insets-${cornerAdaptation ?? 'none'}`).props.children,
  );
}

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
      element.props.onInsetsChange({
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

  describe('cornerAdaptation', () => {
    it('returns the regular insets by default and the variants on request', () => {
      render(
        <SafeAreaProvider initialMetrics={TEST_CORNER_METRICS}>
          <PrintAllCornerInsets />
        </SafeAreaProvider>,
      );
      expect(readInsets()).toEqual(TEST_CORNER_METRICS.insets);
      expect(readInsets('vertical')).toEqual(
        TEST_CORNER_METRICS.verticalCornerAdaptedInsets,
      );
      expect(readInsets('horizontal')).toEqual(
        TEST_CORNER_METRICS.horizontalCornerAdaptedInsets,
      );
    });

    it('falls back to the regular insets when metrics have no variants', () => {
      render(
        <SafeAreaProvider initialMetrics={TEST_METRICS_1}>
          <PrintAllCornerInsets />
        </SafeAreaProvider>,
      );
      expect(readInsets('vertical')).toEqual(TEST_METRICS_1.insets);
      expect(readInsets('horizontal')).toEqual(TEST_METRICS_1.insets);
    });

    it('updates the variants from the native event', async () => {
      render(
        <SafeAreaProvider testID="safe-area-provider">
          <PrintAllCornerInsets />
        </SafeAreaProvider>,
      );
      const element = await screen.findByTestId('safe-area-provider');
      act(() => {
        element.props.onInsetsChange({ nativeEvent: TEST_CORNER_METRICS });
      });
      expect(readInsets()).toEqual(TEST_CORNER_METRICS.insets);
      expect(readInsets('vertical')).toEqual(
        TEST_CORNER_METRICS.verticalCornerAdaptedInsets,
      );
      expect(readInsets('horizontal')).toEqual(
        TEST_CORNER_METRICS.horizontalCornerAdaptedInsets,
      );

      act(() => {
        element.props.onInsetsChange({ nativeEvent: TEST_METRICS_2 });
      });
      expect(readInsets('vertical')).toEqual(TEST_METRICS_2.insets);
      expect(readInsets('horizontal')).toEqual(TEST_METRICS_2.insets);
    });

    it('does not re-render plain consumers when only a variant changes', async () => {
      const onPlainRender = jest.fn();
      const onVerticalRender = jest.fn();
      render(
        <SafeAreaProvider
          testID="safe-area-provider"
          initialMetrics={TEST_CORNER_METRICS}
        >
          <PlainConsumer onRender={onPlainRender} />
          <VerticalConsumer onRender={onVerticalRender} />
        </SafeAreaProvider>,
      );
      const element = await screen.findByTestId('safe-area-provider');
      onPlainRender.mockClear();
      onVerticalRender.mockClear();
      act(() => {
        element.props.onInsetsChange({
          nativeEvent: {
            ...TEST_CORNER_METRICS,
            verticalCornerAdaptedInsets: {
              top: 20,
              left: 0,
              right: 84,
              bottom: 34,
            },
          },
        });
      });
      expect(onPlainRender).not.toHaveBeenCalled();
      expect(onVerticalRender).toHaveBeenCalledTimes(1);
      expect(readInsets('vertical')).toEqual({
        top: 20,
        left: 0,
        right: 84,
        bottom: 34,
      });
    });

    it('uses parent variants when available', () => {
      render(
        <SafeAreaProvider initialMetrics={TEST_CORNER_METRICS}>
          <SafeAreaProvider>
            <PrintAllCornerInsets />
          </SafeAreaProvider>
        </SafeAreaProvider>,
      );
      expect(readInsets('vertical')).toEqual(
        TEST_CORNER_METRICS.verticalCornerAdaptedInsets,
      );
      expect(readInsets('horizontal')).toEqual(
        TEST_CORNER_METRICS.horizontalCornerAdaptedInsets,
      );
    });
  });
});

const PlainConsumer = React.memo(({ onRender }: { onRender: () => void }) => (
  <PrintCornerInsets onRender={onRender} />
));

const VerticalConsumer = React.memo(
  ({ onRender }: { onRender: () => void }) => (
    <PrintCornerInsets cornerAdaptation="vertical" onRender={onRender} />
  ),
);
