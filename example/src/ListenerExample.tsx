import * as React from 'react';
import { StatusBar, TextInput } from 'react-native';

import {
  EdgeInsets,
  Rect,
  SafeAreaListener,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { DataView } from './components/DataView';
import { Card } from './components/Card';

export default function ListenerExample() {
  const [data, setData] = React.useState<{
    insets: EdgeInsets;
    frame: Rect;
  } | null>(null);

  return (
    <SafeAreaListener onChange={setData}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#eee' }}>
        <Card title="Input">
          <TextInput style={{ backgroundColor: '#eee', borderRadius: 3 }} />
        </Card>
        <Card title="Provider insets">
          <DataView data={data?.insets} />
        </Card>
        <Card title="Provider frame">
          <DataView data={data?.frame} />
        </Card>
      </SafeAreaView>
    </SafeAreaListener>
  );
}
