import type * as React from 'react';
import type { NativeSyntheticEvent, View, ViewProps } from 'react-native';
import NativeSafeAreaView from './specs/NativeSafeAreaView';

export type Edge = 'top' | 'right' | 'bottom' | 'left';
export type EdgeMode = 'off' | 'additive' | 'maximum';

export type CornerAdaptation = 'vertical' | 'horizontal';

export type EdgeRecord = Partial<Record<Edge, EdgeMode>>;
export type Edges = readonly Edge[] | Readonly<EdgeRecord>;

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CornerAdaptedInsets {
  vertical: EdgeInsets;
  horizontal: EdgeInsets;
}

export interface Metrics {
  insets: EdgeInsets;
  frame: Rect;
  /**
   * Safe area insets enlarged on the top and bottom edges where the display's
   * rounded corners reach past the regular safe area. Defaults to `insets`.
   */
  verticalCornerAdaptedInsets?: EdgeInsets;
  /**
   * Safe area insets enlarged on the left and right edges where the display's
   * rounded corners reach past the regular safe area. Defaults to `insets`.
   */
  horizontalCornerAdaptedInsets?: EdgeInsets;
}

export type InsetChangedEvent = NativeSyntheticEvent<Metrics>;

export type InsetChangeNativeCallback = (event: InsetChangedEvent) => void;

export interface NativeSafeAreaProviderProps extends ViewProps {
  ref?: React.Ref<View>;
  children?: React.ReactNode;
  onInsetsChange: InsetChangeNativeCallback;
}

export interface NativeSafeAreaViewProps extends ViewProps {
  children?: React.ReactNode;
  mode?: 'padding' | 'margin';
  edges?: Edges;
  /**
   * Apply the corner-adapted safe area insets of the given axis instead of
   * the regular ones.
   */
  cornerAdaptation?: CornerAdaptation;
}

export type NativeSafeAreaViewInstance = InstanceType<
  typeof NativeSafeAreaView
>;
