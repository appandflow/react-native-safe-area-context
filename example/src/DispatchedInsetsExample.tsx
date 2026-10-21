import * as React from 'react';
import {
  Platform,
  requireNativeComponent,
  StatusBar,
  Switch,
  Text,
  View,
  ViewProps,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const TAB_BAR_HEIGHT = 80;

const InsetsTestContainer =
  Platform.OS === 'android'
    ? requireNativeComponent<ViewProps & { extraBottomInset: number }>(
        'InsetsTestContainer',
      )
    : View;

function formatInsets(insets: { top: number; bottom: number }) {
  return `top ${insets.top.toFixed(1)} · bottom ${insets.bottom.toFixed(1)}`;
}

function ContainerContent({ rootBottomInset }: { rootBottomInset: number }) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, backgroundColor: '#f4a261' }}
      >
        <View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#292929' }}>
            Provider inside the container
          </Text>
          <Text testID="inner-insets" style={{ color: '#292929' }}>
            useSafeAreaInsets: {formatInsets(insets)}
          </Text>
          <Text style={{ marginTop: 8, color: '#555' }}>
            The orange band is the bottom padding of a SafeAreaView in this
            provider. White content should end at the top of the floating tab
            bar.
          </Text>
        </View>
      </SafeAreaView>
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
    </>
  );
}

function Screen() {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = React.useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: '#eee' }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
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
            Container adds {TAB_BAR_HEIGHT}dp bottom inset
          </Text>
          <Switch
            testID="extra-inset-switch"
            value={enabled}
            onValueChange={setEnabled}
          />
        </View>
      </View>
      <InsetsTestContainer
        style={{ flex: 1 }}
        extraBottomInset={enabled ? TAB_BAR_HEIGHT : 0}
      >
        <SafeAreaProvider>
          <ContainerContent rootBottomInset={insets.bottom} />
        </SafeAreaProvider>
      </InsetsTestContainer>
    </View>
  );
}

export default function DispatchedInsetsExample() {
  return (
    <SafeAreaProvider>
      <Screen />
    </SafeAreaProvider>
  );
}
