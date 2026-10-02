import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';
import type { Metrics } from '../../SafeArea.types';
import mockSafeAreaContext from '../mock';

// This is the setup consuming apps are told to use in the README.
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

const { SafeAreaProvider, useSafeAreaFrame, useSafeAreaInsets } =
  require('react-native-safe-area-context') as typeof import('../../index');

const TEST_METRICS: Metrics = {
  insets: { top: 1, left: 2, right: 3, bottom: 4 },
  frame: { x: 0, y: 0, width: 100, height: 200 },
};

const PrintMetricsTestView = () => {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  return <Text>{`${insets.top} ${frame.width}`}</Text>;
};

const renderTestView = () =>
  render(
    <SafeAreaProvider initialMetrics={TEST_METRICS}>
      <PrintMetricsTestView />
    </SafeAreaProvider>,
  );

describe('jest mock', () => {
  beforeEach(() => {
    // Consuming apps commonly do this in a global setup file, which used to
    // strip the mock implementations and make the hooks return undefined.
    jest.resetAllMocks();
  });

  it('keeps returning metrics after jest.resetAllMocks()', () => {
    renderTestView();

    expect(screen.getByText('1 100')).toBeDefined();
  });

  it('still lets tests override the hooks after jest.resetAllMocks()', () => {
    jest.mocked(useSafeAreaInsets).mockReturnValue({
      top: 42,
      left: 0,
      right: 0,
      bottom: 0,
    });

    renderTestView();

    expect(screen.getByText('42 100')).toBeDefined();
  });

  it('still records calls after jest.resetAllMocks()', () => {
    renderTestView();

    expect(jest.mocked(useSafeAreaInsets)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(useSafeAreaFrame)).toHaveBeenCalledTimes(1);
  });
});
