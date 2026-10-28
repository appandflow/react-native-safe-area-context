import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import type { Metrics } from '../SafeArea.types';
import { SafeAreaProvider } from '../SafeAreaContext';
import { SafeAreaView } from '../SafeAreaView.web';

const INITIAL_METRICS: Metrics = {
  insets: { top: 1, left: 2, right: 3, bottom: 4 },
  frame: { x: 0, y: 0, height: 100, width: 100 },
};

function renderedStyle() {
  return StyleSheet.flatten(screen.getByTestId('safe-area-view').props.style);
}

describe('SafeAreaView.web', () => {
  it('adds the insets to percentage padding', () => {
    render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <SafeAreaView testID="safe-area-view" style={{ padding: '5%' }} />
      </SafeAreaProvider>,
    );
    expect(renderedStyle()).toMatchObject({
      paddingTop: 'calc(5% + 1px)',
      paddingRight: 'calc(5% + 3px)',
      paddingBottom: 'calc(5% + 4px)',
      paddingLeft: 'calc(5% + 2px)',
    });
  });

  it('uses the larger of percentage padding and the inset in maximum mode', () => {
    render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <SafeAreaView
          testID="safe-area-view"
          edges={{ top: 'maximum' }}
          style={{ paddingTop: '10%', paddingBottom: '10%' }}
        />
      </SafeAreaProvider>,
    );
    expect(renderedStyle()).toMatchObject({
      paddingTop: 'max(10%, 1px)',
      paddingBottom: '10%',
    });
  });

  it('applies the insets to plain number strings', () => {
    // react-native-web accepts plain number strings such as '0'.
    const style = {
      paddingTop: '0',
      paddingBottom: '0',
    } as unknown as ViewStyle;
    render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <SafeAreaView
          testID="safe-area-view"
          edges={{ top: 'maximum', bottom: 'additive' }}
          style={style}
        />
      </SafeAreaProvider>,
    );
    expect(renderedStyle()).toMatchObject({
      paddingTop: 1,
      paddingBottom: 4,
    });
  });

  it('keeps auto margins', () => {
    render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <SafeAreaView
          testID="safe-area-view"
          mode="margin"
          style={{ marginHorizontal: 'auto' }}
        />
      </SafeAreaProvider>,
    );
    expect(renderedStyle()).toMatchObject({
      marginTop: 1,
      marginRight: 'auto',
      marginBottom: 4,
      marginLeft: 'auto',
    });
  });
});
