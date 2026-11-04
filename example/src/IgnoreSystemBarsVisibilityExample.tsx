import * as React from 'react';
import {
  Button,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { DataView } from './components/DataView';
import { Card } from './components/Card';

function IgnoreSystemBarsVisibilityScreen({
  ignoreSystemBarsVisibility,
  onIgnoreSystemBarsVisibilityChange,
}: {
  ignoreSystemBarsVisibility: boolean;
  onIgnoreSystemBarsVisibilityChange: (value: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  const [statusBarHidden, setStatusBarHidden] = React.useState(false);

  return (
    <>
      <StatusBar
        hidden={statusBarHidden}
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View
        style={{
          flex: 1,
          backgroundColor: 'red',
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingBottom: insets.bottom,
          paddingRight: insets.right,
        }}
      >
        <ScrollView style={{ flex: 1, backgroundColor: '#eee' }}>
          <Card title="ignoreSystemBarsVisibility">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text>{String(ignoreSystemBarsVisibility)}</Text>
              <Switch
                value={ignoreSystemBarsVisibility}
                onValueChange={onIgnoreSystemBarsVisibilityChange}
              />
            </View>
          </Card>
          <Card title="Status bar">
            <Button
              title={statusBarHidden ? 'Show status bar' : 'Hide status bar'}
              onPress={() => setStatusBarHidden((hidden) => !hidden)}
            />
          </Card>
          <Card title="Provider insets">
            <DataView data={insets} />
          </Card>
        </ScrollView>
      </View>
    </>
  );
}

export default function IgnoreSystemBarsVisibilityExample() {
  const [ignoreSystemBarsVisibility, setIgnoreSystemBarsVisibility] =
    React.useState(true);

  return (
    <SafeAreaProvider ignoreSystemBarsVisibility={ignoreSystemBarsVisibility}>
      <IgnoreSystemBarsVisibilityScreen
        ignoreSystemBarsVisibility={ignoreSystemBarsVisibility}
        onIgnoreSystemBarsVisibilityChange={setIgnoreSystemBarsVisibility}
      />
    </SafeAreaProvider>
  );
}
