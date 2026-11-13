import * as React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from './SafeAreaContext';
import type { Edge } from './SafeArea.types';

export interface DebugViewProps extends ViewProps {
  /**
   * Color of the overlay drawn over the insets. Defaults to a translucent red.
   */
  color?: ColorValue;
  /**
   * Whether to print the inset values. Defaults to `true`.
   */
  showLabels?: boolean;
}

const EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left'];

/**
 * Development helper that draws the safe area insets of the nearest
 * `SafeAreaProvider` on top of its parent. It is absolutely positioned,
 * fills the parent and never intercepts touches.
 *
 * Not exported from the package entry point so that apps that don't use it
 * don't bundle it. Import it from `react-native-safe-area-context/DebugView`.
 */
export function DebugView({
  color = 'rgba(255, 0, 0, 0.3)',
  showLabels = true,
  style,
  ...others
}: DebugViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      {...others}
      style={[StyleSheet.absoluteFill, style]}
    >
      {EDGES.map((edge) => {
        const inset = insets[edge];
        const horizontal = edge === 'top' || edge === 'bottom';
        return (
          <View
            key={edge}
            testID={`safe-area-debug-${edge}`}
            style={[
              styles.edge,
              { backgroundColor: color },
              horizontal
                ? { left: 0, right: 0, height: inset }
                : { top: 0, bottom: 0, width: inset },
              { [edge]: 0 },
            ]}
          >
            {showLabels ? (
              <Text style={styles.label} numberOfLines={1}>
                {`${edge}: ${inset}`}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DebugView;
