import * as React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  View,
} from 'react-native';
import { ScreenStack, ScreenStackItem } from 'react-native-screens';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const TAB_BAR_HEIGHT = 80;

function formatInsets(insets: { top: number; bottom: number }) {
  return `top ${insets.top.toFixed(1)} · bottom ${insets.bottom.toFixed(1)}`;
}

function ScreenContent({ rootBottomInset }: { rootBottomInset: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: 'bold', color: '#292929' }}>
          Provider inside the screen
        </Text>
        <Text testID="inner-insets" style={{ color: '#292929' }}>
          useSafeAreaInsets: {formatInsets(insets)}
        </Text>
      </View>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <SafeAreaView
          edges={['bottom']}
          style={{ flex: 1, backgroundColor: '#f4a261' }}
        >
          <View style={{ flex: 1, backgroundColor: '#e9f5f2', padding: 8 }}>
            <Text style={{ color: '#292929' }}>SafeAreaView</Text>
          </View>
        </SafeAreaView>
        <ScrollView
          style={{ flex: 1 }}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
          }}
        >
          {Array.from({ length: 30 }, (_, i) => (
            <Text
              key={i}
              style={{
                padding: 8,
                color: '#292929',
                borderBottomWidth: 1,
                borderColor: '#ddd',
              }}
            >
              ScrollView row {i + 1}
            </Text>
          ))}
        </ScrollView>
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: rootBottomInset,
          height: TAB_BAR_HEIGHT,
          borderRadius: 24,
          backgroundColor: 'rgba(38, 70, 83, 0.6)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: 'white' }}>Floating tab bar (JS)</Text>
      </View>
    </View>
  );
}

function Content() {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = React.useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: '#eee' }}>
      <StatusBar barStyle="dark-content" />
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 8,
          backgroundColor: 'white',
        }}
      >
        <Text style={{ fontWeight: 'bold', color: '#292929' }}>
          Root provider
        </Text>
        <Text testID="root-insets" style={{ color: '#292929' }}>
          useSafeAreaInsets: {formatInsets(insets)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, color: '#292929' }}>
            additionalSafeAreaInsets bottom {TAB_BAR_HEIGHT}
          </Text>
          <Switch
            testID="additional-insets-switch"
            value={enabled}
            onValueChange={setEnabled}
          />
        </View>
      </View>
      <ScreenStack style={{ flex: 1 }}>
        <ScreenStackItem
          screenId="additional-insets"
          headerConfig={{ hidden: true }}
          additionalSafeAreaInsets={{ bottom: enabled ? TAB_BAR_HEIGHT : 0 }}
          style={{ flex: 1 }}
        >
          <SafeAreaProvider>
            <ScreenContent rootBottomInset={insets.bottom} />
          </SafeAreaProvider>
        </ScreenStackItem>
      </ScreenStack>
    </View>
  );
}

export default function AdditionalInsetsExample() {
  return (
    <SafeAreaProvider>
      <Content />
    </SafeAreaProvider>
  );
}
