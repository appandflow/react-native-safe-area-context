import * as React from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import type { NativeSafeAreaProviderProps } from './SafeArea.types';
import NativeSafeAreaProviderComponent from './specs/NativeSafeAreaProvider';

// Prototype for https://github.com/facebook/react-native/pull/57967, which adds
// `onSafeAreaInsetsChange` to every view in core, with the same payload as our
// own `onInsetsChange`. Where it is available we do not need a native provider
// of our own, and rendering becomes synchronous: core dispatches the event
// synchronously, so the insets are applied in the frame they changed in rather
// than the one after it.
//
// The version to gate on is a placeholder until that lands.
const { major, minor } = Platform.constants.reactNativeVersion;
const SUPPORTS_CORE_SAFE_AREA_INSETS = major > 0 || minor >= 88;

// Drop once the installed react-native types declare the prop.
type ViewPropsWithSafeAreaInsets = ViewProps & {
  onSafeAreaInsetsChange?: NativeSafeAreaProviderProps['onInsetsChange'];
};
const InsetsView = View as React.ComponentType<ViewPropsWithSafeAreaInsets>;

function CoreNativeSafeAreaProvider({
  children,
  style,
  onInsetsChange,
}: NativeSafeAreaProviderProps) {
  return (
    <InsetsView style={style} onSafeAreaInsetsChange={onInsetsChange}>
      {children}
    </InsetsView>
  );
}

export const NativeSafeAreaProvider = SUPPORTS_CORE_SAFE_AREA_INSETS
  ? CoreNativeSafeAreaProvider
  : NativeSafeAreaProviderComponent;
