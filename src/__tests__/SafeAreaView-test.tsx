import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import * as React from 'react';
import { View } from 'react-native';
import type { Metrics } from '../SafeArea.types';
import { SafeAreaProvider } from '../SafeAreaContext';
import { SafeAreaView } from '../SafeAreaView';

const INITIAL_METRICS: Metrics = {
  insets: { top: 1, left: 2, right: 3, bottom: 4 },
  frame: { x: 0, y: 0, height: 100, width: 100 },
};

describe('SafeAreaView', () => {
  it('renders', () => {
    const { toJSON } = render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <SafeAreaView>
          <View />
        </SafeAreaView>
      </SafeAreaProvider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('can override padding styles', () => {
    const { toJSON } = render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <SafeAreaView style={{ paddingTop: 0 }}>
          <View />
        </SafeAreaView>
      </SafeAreaProvider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('can set edges', () => {
    const { toJSON } = render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <SafeAreaView edges={['top', 'bottom']}>
          <View />
        </SafeAreaView>
      </SafeAreaProvider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('can set edges value type', () => {
    const { toJSON } = render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <SafeAreaView
          edges={{ top: 'additive', bottom: 'maximum' }}
          style={{ paddingTop: 24, paddingBottom: 24 }}
        >
          <View />
        </SafeAreaView>
      </SafeAreaProvider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('passes cornerAdaptation to the native view', () => {
    const { toJSON } = render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <SafeAreaView cornerAdaptation="vertical">
          <View />
        </SafeAreaView>
      </SafeAreaProvider>,
    );
    expect(toJSON()).toMatchObject({
      children: [{ props: { cornerAdaptation: 'vertical' } }],
    });
  });
});
