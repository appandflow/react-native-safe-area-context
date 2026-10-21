import * as React from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CornerAdaptation,
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Card } from './components/Card';
import { DataView } from './components/DataView';

const HEADER_MODES = ['vertical', 'horizontal', 'none'] as const;
type HeaderMode = (typeof HEADER_MODES)[number];

function CornerAdaptationScreen() {
  const [headerMode, setHeaderMode] = React.useState<HeaderMode>('vertical');
  const insets = useSafeAreaInsets();
  const verticalInsets = useSafeAreaInsets({ cornerAdaptation: 'vertical' });
  const horizontalInsets = useSafeAreaInsets({
    cornerAdaptation: 'horizontal',
  });

  const cornerAdaptation: CornerAdaptation | undefined =
    headerMode === 'none' ? undefined : headerMode;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <SafeAreaView
        edges={['top', 'left', 'right']}
        cornerAdaptation={cornerAdaptation}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Back</Text>
          </View>
          <Text style={styles.headerTitle}>Corners</Text>
          <TouchableOpacity
            testID="corner-adaptation-toggle"
            style={styles.headerButton}
            onPress={() =>
              setHeaderMode(
                (mode) =>
                  HEADER_MODES[
                    (HEADER_MODES.indexOf(mode) + 1) % HEADER_MODES.length
                  ],
              )
            }
          >
            <Text style={styles.headerButtonText}>{headerMode}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={{
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
        }}
      >
        <Card title="Header cornerAdaptation">
          <Text style={styles.text}>{headerMode}</Text>
        </Card>
        <Card title="Regular insets">
          <DataView data={insets} />
        </Card>
        <Card title="Vertical corner-adapted insets">
          <DataView data={verticalInsets} />
        </Card>
        <Card title="Horizontal corner-adapted insets">
          <DataView data={horizontalInsets} />
        </Card>
        <Card title="Initial window vertical insets">
          <DataView data={initialWindowMetrics?.verticalCornerAdaptedInsets} />
        </Card>
        <Card title="Initial window horizontal insets">
          <DataView
            data={initialWindowMetrics?.horizontalCornerAdaptedInsets}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

export default function CornerAdaptationExample() {
  // react-native-test-app hosts the app in a UINavigationController, whose
  // safe area already clears the corners. A full screen Modal is presented
  // outside of it, like the root view of most apps.
  return (
    <Modal
      visible
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SafeAreaProvider>
        <CornerAdaptationScreen />
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  header: {
    backgroundColor: '#1f5fbf',
  },
  headerContent: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    backgroundColor: '#ffb300',
    paddingHorizontal: 12,
    height: 32,
    justifyContent: 'center',
  },
  headerButtonText: {
    color: '#292929',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  text: {
    fontSize: 16,
    color: '#292929',
  },
});
