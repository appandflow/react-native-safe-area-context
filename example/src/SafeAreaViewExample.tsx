import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  Edge,
} from 'react-native-safe-area-context';

export default function ReactNativeSafeAreaView() {
  const [mode, setMode] = React.useState<'padding' | 'margin'>('padding');
  const [additionalMargin, setAdditionalMargin] = React.useState(false);
  const [additionalPadding, setAdditionalPadding] = React.useState(false);

  const [top, setTop] = React.useState(true);
  const [right, setRight] = React.useState(true);
  const [bottom, setBottom] = React.useState(true);
  const [left, setLeft] = React.useState(true);

  const edges: Edge[] = [];
  if (top) {
    edges.push('top');
  }
  if (right) {
    edges.push('right');
  }
  if (bottom) {
    edges.push('bottom');
  }
  if (left) {
    edges.push('left');
  }

  const modeTint = mode === 'padding' ? paddingColor : marginColor;
  const edgeSwitchBaseProps = Platform.select({
    ios: {
      trackColor: { true: modeTint, false: '' },
    },
    android: {
      thumbColor: modeTint,
    },
  });

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={top ? 'light-content' : 'dark-content'} />
      <View style={styles.background}>
        <SafeAreaView
          style={[
            styles.safeArea,
            {
              margin: additionalMargin ? 8 : 0,
              padding: additionalPadding ? 8 : 0,
            },
          ]}
          mode={mode}
          edges={edges}
        >
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            alwaysBounceVertical={false}
          >
            <Text style={styles.text}>
              Edges{'\n'}
              <Text style={styles.subText}>
                Make sure at least one is picked!
              </Text>
            </Text>
            <View style={styles.edges}>
              <Switch
                value={top}
                onValueChange={setTop}
                style={{ position: 'absolute', top: 5 }}
                {...edgeSwitchBaseProps}
              />
              <Switch
                value={right}
                onValueChange={setRight}
                style={{ position: 'absolute', right: 5 }}
                {...edgeSwitchBaseProps}
              />
              <Switch
                value={bottom}
                onValueChange={setBottom}
                style={{ position: 'absolute', bottom: 5 }}
                {...edgeSwitchBaseProps}
              />
              <Switch
                value={left}
                onValueChange={setLeft}
                style={{ position: 'absolute', left: 5 }}
                {...edgeSwitchBaseProps}
              />
            </View>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setMode(mode === 'padding' ? 'margin' : 'padding')}
            >
              <Text style={styles.text}>
                Safe areas added to{' '}
                <Text style={{ color: modeTint }}>{mode}</Text>
                {'\n'}
                <Text style={styles.subText}>Tap to toggle</Text>
              </Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <View style={styles.row}>
              <Text style={styles.text}>
                Add additional{' '}
                <Text style={{ color: paddingColor }}>padding</Text>
              </Text>
              <Switch
                value={additionalPadding}
                onValueChange={setAdditionalPadding}
                trackColor={{ true: paddingColor, false: '' }}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>
                Add additional{' '}
                <Text style={{ color: marginColor }}>margin</Text>
              </Text>
              <Switch
                value={additionalMargin}
                onValueChange={setAdditionalMargin}
                trackColor={{ true: marginColor, false: '' }}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const marginColor = '#5f27cd';
const paddingColor = '#10ac84';

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: marginColor,
  },
  safeArea: {
    flex: 1,
    backgroundColor: paddingColor,
    // Make sure view props work.
    borderRadius: 16,
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'center',
  },
  edges: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 100,
    width: 200,
    height: 200,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c8d6e5',
    borderRadius: 6,
  },
  row: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  separator: {
    marginVertical: 12,
    backgroundColor: '#c8d6e5',
    height: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 17,
    lineHeight: 24,
    color: '#222f3e',
  },
  subText: {
    fontSize: 14,
    color: '#576574',
  },
});
