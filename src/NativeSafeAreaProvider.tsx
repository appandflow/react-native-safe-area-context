import * as React from 'react';
import type { NativeSafeAreaProviderProps } from './SafeArea.types';
import {
  InsetsView,
  SUPPORTS_CORE_SAFE_AREA_INSETS,
} from './coreSafeAreaInsets';
import NativeSafeAreaProviderComponent from './specs/NativeSafeAreaProvider';

function CoreNativeSafeAreaProvider({
  children,
  style,
  onInsetsChange,
  ...rest
}: NativeSafeAreaProviderProps) {
  return (
    <InsetsView {...rest} style={style} onSafeAreaInsetsChange={onInsetsChange}>
      {children}
    </InsetsView>
  );
}

export const NativeSafeAreaProvider = SUPPORTS_CORE_SAFE_AREA_INSETS
  ? CoreNativeSafeAreaProvider
  : NativeSafeAreaProviderComponent;
