import * as React from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import {
  Edge,
  EdgeMode,
  EdgeRecord,
  NativeSafeAreaViewInstance,
  NativeSafeAreaViewProps,
} from './SafeArea.types';
import { useSafeAreaInsets } from './SafeAreaContext';

const defaultEdges: Record<Edge, EdgeMode> = {
  top: 'additive',
  left: 'additive',
  bottom: 'additive',
  right: 'additive',
};

function getEdgeValue(
  inset: number,
  current: number | string,
  mode: EdgeMode | undefined,
): DimensionValue {
  if (typeof current === 'string') {
    // `calc()` and `max()` are valid styles on web but not DimensionValues.
    return getStringEdgeValue(inset, current, mode) as DimensionValue;
  }
  switch (mode) {
    case 'maximum':
      return Math.max(current, inset);
    case 'additive':
      return current + inset;
    case 'off':
    default:
      return current;
  }
}

// A string cannot be added to the inset in JS. A plain number such as '0' is
// converted, and CSS combines other values such as percentages with the inset.
// CSS cannot combine `auto` with a length, so an `auto` margin is kept.
function getStringEdgeValue(
  inset: number,
  current: string,
  mode: EdgeMode | undefined,
) {
  if (current === 'auto' || (mode !== 'additive' && mode !== 'maximum')) {
    return current;
  }
  const value = Number(current);
  if (Number.isFinite(value)) {
    return getEdgeValue(inset, value, mode);
  }
  return mode === 'additive'
    ? `calc(${current} + ${inset}px)`
    : `max(${current}, ${inset}px)`;
}

export const SafeAreaView = React.forwardRef<
  NativeSafeAreaViewInstance,
  NativeSafeAreaViewProps
>(({ style = {}, mode, edges, cornerAdaptation, ...rest }, ref) => {
  const insets = useSafeAreaInsets({ cornerAdaptation });

  const edgesRecord = React.useMemo(() => {
    if (edges == null) {
      return defaultEdges;
    }

    return Array.isArray(edges)
      ? edges.reduce<EdgeRecord>((acc, edge: Edge) => {
          acc[edge] = 'additive';
          return acc;
        }, {})
      : // ts has trouble with refining readonly arrays.
        (edges as EdgeRecord);
  }, [edges]);

  const appliedStyle = React.useMemo(() => {
    const flatStyle = StyleSheet.flatten(style) as Record<
      string,
      number | string
    >;

    if (mode === 'margin') {
      const {
        margin = 0,
        marginVertical = margin,
        marginHorizontal = margin,
        marginTop = marginVertical,
        marginRight = marginHorizontal,
        marginBottom = marginVertical,
        marginLeft = marginHorizontal,
      } = flatStyle;

      const marginStyle = {
        marginTop: getEdgeValue(insets.top, marginTop, edgesRecord.top),
        marginRight: getEdgeValue(insets.right, marginRight, edgesRecord.right),
        marginBottom: getEdgeValue(
          insets.bottom,
          marginBottom,
          edgesRecord.bottom,
        ),
        marginLeft: getEdgeValue(insets.left, marginLeft, edgesRecord.left),
      };

      return [style, marginStyle];
    } else {
      const {
        padding = 0,
        paddingVertical = padding,
        paddingHorizontal = padding,
        paddingTop = paddingVertical,
        paddingRight = paddingHorizontal,
        paddingBottom = paddingVertical,
        paddingLeft = paddingHorizontal,
      } = flatStyle;

      const paddingStyle = {
        paddingTop: getEdgeValue(insets.top, paddingTop, edgesRecord.top),
        paddingRight: getEdgeValue(
          insets.right,
          paddingRight,
          edgesRecord.right,
        ),
        paddingBottom: getEdgeValue(
          insets.bottom,
          paddingBottom,
          edgesRecord.bottom,
        ),
        paddingLeft: getEdgeValue(insets.left, paddingLeft, edgesRecord.left),
      };

      return [style, paddingStyle];
    }
  }, [
    edgesRecord.bottom,
    edgesRecord.left,
    edgesRecord.right,
    edgesRecord.top,
    insets.bottom,
    insets.left,
    insets.right,
    insets.top,
    mode,
    style,
  ]);

  return <View style={appliedStyle} {...rest} ref={ref} />;
});
