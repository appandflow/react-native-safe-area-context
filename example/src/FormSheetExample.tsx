import * as React from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// A SafeAreaView in a native formSheet has no SafeAreaProvider above it in the view hierarchy, so
// it is its own provider. Rotate the device with the sheet open: the red border must stay clear of
// the notch / Dynamic Island on both sides, also when "Busy JS thread" is on. The second sheet
// wraps the same content in a SafeAreaProvider, so its SafeAreaView follows the provider instead.

type Routes = {
  Home: undefined;
  Sheet: undefined;
  SheetWithProvider: undefined;
};

const Stack = createNativeStackNavigator<Routes>();

// Blocks the JS thread for most of every second, like a busy app. With the default asynchronous
// state update the insets then lag behind a rotation by several frames.
function useBusyJsThread(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    const id = setInterval(() => {
      const end = Date.now() + 900;
      while (Date.now() < end) {
        // busy
      }
    }, 1000);
    return () => clearInterval(id);
  }, [enabled]);
}

// Mounts and unmounts many SafeAreaViews, to check that the state update stays cheap while
// they mount.
function ManySafeAreaViews() {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setCount((c) => (c === 0 ? 200 : 0)), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }, (_, i) => (
        <SafeAreaView key={i} edges={['left', 'right']} style={styles.cell} />
      ))}
    </View>
  );
}

function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Routes, 'Home'>>();
  return (
    <View style={styles.home}>
      <Button title="Open sheet" onPress={() => navigation.navigate('Sheet')} />
      <Button
        title="Open sheet with a SafeAreaProvider"
        onPress={() => navigation.navigate('SheetWithProvider')}
      />
    </View>
  );
}

function SheetScreen({ title = 'SafeAreaView in a form sheet' }) {
  const [busy, setBusy] = React.useState(false);
  const [manyViews, setManyViews] = React.useState(false);
  useBusyJsThread(busy);
  return (
    <ScrollView contentContainerStyle={styles.sheetContent}>
      <SafeAreaView edges={['left', 'right']}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.text}>
            Rotate the device. The red border must stay clear of the notch on
            both sides, right after the rotation.
          </Text>
          <View style={styles.row}>
            <Text style={styles.text}>Busy JS thread</Text>
            <Switch value={busy} onValueChange={setBusy} />
          </View>
          <View style={styles.row}>
            <Text style={styles.text}>Mount 200 SafeAreaViews</Text>
            <Switch value={manyViews} onValueChange={setManyViews} />
          </View>
          {manyViews && <ManySafeAreaViews />}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function SheetWithProviderScreen() {
  return (
    <SafeAreaProvider>
      <SheetScreen title="SafeAreaView under a provider in a form sheet" />
    </SafeAreaProvider>
  );
}

const sheetOptions = {
  presentation: 'formSheet',
  sheetAllowedDetents: [1.0],
  sheetGrabberVisible: true,
  headerShown: false,
} as const;

export default function FormSheetExample() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Sheet"
            component={SheetScreen}
            options={sheetOptions}
          />
          <Stack.Screen
            name="SheetWithProvider"
            component={SheetWithProviderScreen}
            options={sheetOptions}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  home: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  sheetContent: { paddingVertical: 24 },
  box: {
    minHeight: 600,
    borderColor: 'red',
    borderWidth: 4,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  text: { fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell: { width: 8, height: 8, backgroundColor: 'red' },
});
