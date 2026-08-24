import { expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import mockSafeAreaContext from '../jest/mock';
import type { Metrics } from '../SafeArea.types';

it('preserves the package runtime export surface', () => {
  expect(Object.keys(mockSafeAreaContext).sort()).toEqual([
    'SafeAreaConsumer',
    'SafeAreaContext',
    'SafeAreaFrameContext',
    'SafeAreaInsetsContext',
    'SafeAreaListener',
    'SafeAreaProvider',
    'SafeAreaView',
    'initialWindowMetrics',
    'initialWindowSafeAreaInsets',
    'useSafeArea',
    'useSafeAreaFrame',
    'useSafeAreaInsets',
    'withSafeAreaInsets',
  ]);
});

it('provides custom metrics without loading native components', () => {
  const metrics: Metrics = {
    frame: { x: 1, y: 2, width: 300, height: 600 },
    insets: { top: 10, right: 20, bottom: 30, left: 40 },
  };
  const onRender = jest.fn();

  const Probe = () => {
    onRender({
      frame: mockSafeAreaContext.useSafeAreaFrame(),
      insets: mockSafeAreaContext.useSafeAreaInsets(),
    });
    return null;
  };

  render(
    <mockSafeAreaContext.SafeAreaProvider initialMetrics={metrics}>
      <Probe />
    </mockSafeAreaContext.SafeAreaProvider>,
  );

  expect(onRender).toHaveBeenLastCalledWith(metrics);
});

it('keeps SafeAreaView props available to tests', () => {
  render(<mockSafeAreaContext.SafeAreaView testID="safe-area-view" />);

  expect(screen.getByTestId('safe-area-view')).toBeTruthy();
});

it('maps native inset events to SafeAreaListener callbacks', () => {
  const onChange = jest.fn();
  const metrics: Metrics = {
    frame: { x: 1, y: 2, width: 300, height: 600 },
    insets: { top: 10, right: 20, bottom: 30, left: 40 },
  };
  render(
    <mockSafeAreaContext.SafeAreaListener
      testID="safe-area-listener"
      onChange={onChange}
    />,
  );

  screen.getByTestId('safe-area-listener').props.onInsetsChange({
    nativeEvent: metrics,
  });

  expect(onChange).toHaveBeenCalledWith(metrics);
});
