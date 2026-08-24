import * as React from 'react';
import { View, StatusBar, ScrollView, TextInput } from 'react-native';

import {
  SafeAreaProvider,
  useSafeAreaInsets,
  initialWindowMetrics,
  useSafeAreaFrame,
} from 'react-native-safe-area-context';
import { DataView } from './components/DataView';
import { Card } from './components/Card';

const BORDER_WIDTH = 8;

function SimpleExampleScreen() {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View
        style={{
          width: frame.width,
          height: frame.height,
          backgroundColor: 'red',
          paddingTop: insets.top - BORDER_WIDTH,
          paddingLeft: insets.left - BORDER_WIDTH,
          paddingBottom: insets.bottom - BORDER_WIDTH,
          paddingRight: insets.right - BORDER_WIDTH,
          borderColor: 'blue',
          borderWidth: BORDER_WIDTH,
        }}
      >
        <ScrollView style={{ flex: 1, backgroundColor: '#eee' }}>
          <Card title="Input">
            <TextInput style={{ backgroundColor: '#eee', borderRadius: 3 }} />
          </Card>
          <Card title="Provider insets">
            <DataView data={insets} />
          </Card>
          <Card title="Provider frame">
            <DataView data={frame} />
          </Card>
          <Card title="Initial window insets">
            <DataView data={initialWindowMetrics?.insets} />
          </Card>
          <Card title="Initial window frame">
            <DataView data={initialWindowMetrics?.frame} />
          </Card>
        </ScrollView>
      </View>
    </>
  );
}

export default function SimpleExample() {
  return (
    <View style={{ marginTop: 0, flex: 1 }}>
      <SafeAreaProvider>
        <SimpleExampleScreen />
      </SafeAreaProvider>
    </View>
  );
}
