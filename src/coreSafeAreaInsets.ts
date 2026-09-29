import * as React from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import type { InsetChangeNativeCallback } from './SafeArea.types';

// Prototype for https://github.com/facebook/react-native/pull/57967, which adds
// an `onSafeAreaInsetsChange` prop to every view in core, with the same payload
// as our own `onInsetsChange`. Where it is available the library needs no
// native code: any view can observe its own insets, and rendering becomes
// synchronous — core dispatches the event synchronously, so insets are applied
// in the frame they changed in rather than the one after it.
//
// The version to gate on is a placeholder until that lands. React Native is
// Fabric-only by then, so the version implies the new architecture.
const { major, minor } = Platform.constants.reactNativeVersion;
export const SUPPORTS_CORE_SAFE_AREA_INSETS = major > 0 || minor >= 88;

// Drop once the installed react-native types declare the prop.
export type ViewPropsWithSafeAreaInsets = ViewProps & {
  onSafeAreaInsetsChange?: InsetChangeNativeCallback;
};
export const InsetsView = View as React.ComponentType<
  ViewPropsWithSafeAreaInsets & React.RefAttributes<View>
>;
