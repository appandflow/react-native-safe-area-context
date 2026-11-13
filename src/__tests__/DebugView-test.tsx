import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { DebugView } from '../DebugView';
import type { Metrics } from '../SafeArea.types';
import { SafeAreaProvider } from '../SafeAreaContext';

const INITIAL_METRICS: Metrics = {
  insets: { top: 1, left: 2, right: 3, bottom: 4 },
  frame: { x: 0, y: 0, height: 100, width: 100 },
};

describe('DebugView', () => {
  it('draws every inset with its size and label', () => {
    render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <DebugView />
      </SafeAreaProvider>,
    );

    const top = StyleSheet.flatten(
      screen.getByTestId('safe-area-debug-top').props.style,
    );
    const bottom = StyleSheet.flatten(
      screen.getByTestId('safe-area-debug-bottom').props.style,
    );
    const left = StyleSheet.flatten(
      screen.getByTestId('safe-area-debug-left').props.style,
    );
    const right = StyleSheet.flatten(
      screen.getByTestId('safe-area-debug-right').props.style,
    );

    expect(top).toMatchObject({ top: 0, left: 0, right: 0, height: 1 });
    expect(bottom).toMatchObject({ bottom: 0, left: 0, right: 0, height: 4 });
    expect(left).toMatchObject({ left: 0, top: 0, bottom: 0, width: 2 });
    expect(right).toMatchObject({ right: 0, top: 0, bottom: 0, width: 3 });
    expect(screen.getByText('top: 1')).toBeTruthy();
    expect(screen.getByText('right: 3')).toBeTruthy();
    expect(screen.getByText('bottom: 4')).toBeTruthy();
    expect(screen.getByText('left: 2')).toBeTruthy();
  });

  it('does not intercept touches', () => {
    render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <DebugView testID="debug" />
      </SafeAreaProvider>,
    );
    expect(screen.getByTestId('debug').props.pointerEvents).toBe('none');
  });

  it('supports a custom color and hiding labels', () => {
    render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <DebugView color="blue" showLabels={false} />
      </SafeAreaProvider>,
    );
    const top = StyleSheet.flatten(
      screen.getByTestId('safe-area-debug-top').props.style,
    );
    expect(top.backgroundColor).toBe('blue');
    expect(screen.queryByText('top: 1')).toBeNull();
  });
});
