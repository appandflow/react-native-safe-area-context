import { Dimensions, type ScaledSize } from 'react-native';
import type { EdgeInsets, Metrics } from './SafeArea.types';
import { SUPPORTS_CORE_SAFE_AREA_INSETS } from './coreSafeAreaInsets';
import NativeSafeAreaContext from './specs/NativeSafeAreaContext';

// Drop once the installed react-native types declare the field.
type ScaledSizeWithInsets = ScaledSize & {
  safeAreaInsets?: EdgeInsets;
};

function getInitialWindowMetrics(): Metrics | null {
  if (SUPPORTS_CORE_SAFE_AREA_INSETS) {
    // Core reports window safe area insets through the Dimensions module,
    // using the same native code as the `onSafeAreaInsetsChange` view prop.
    const { width, height, safeAreaInsets } = Dimensions.get(
      'window',
    ) as ScaledSizeWithInsets;
    if (safeAreaInsets == null) {
      return null;
    }
    return {
      insets: safeAreaInsets,
      frame: { x: 0, y: 0, width, height },
    };
  }
  return (NativeSafeAreaContext?.getConstants?.()?.initialWindowMetrics ??
    null) as Metrics | null;
}

export const initialWindowMetrics = getInitialWindowMetrics();

/**
 * @deprecated
 */
export const initialWindowSafeAreaInsets = initialWindowMetrics?.insets;
