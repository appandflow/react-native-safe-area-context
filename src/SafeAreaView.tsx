import * as React from 'react';
import type {
  Edge,
  EdgeMode,
  EdgeRecord,
  NativeSafeAreaViewInstance,
  NativeSafeAreaViewProps,
} from './SafeArea.types';
import { JSSafeAreaView } from './JSSafeAreaView';
import { SUPPORTS_CORE_SAFE_AREA_INSETS } from './coreSafeAreaInsets';
import NativeSafeAreaView from './specs/NativeSafeAreaView';
import { useMemo } from 'react';

const defaultEdges: Record<Edge, EdgeMode> = {
  top: 'additive',
  left: 'additive',
  bottom: 'additive',
  right: 'additive',
};

export type SafeAreaViewProps = NativeSafeAreaViewProps;

const NativeBackedSafeAreaView = React.forwardRef<
  NativeSafeAreaViewInstance,
  SafeAreaViewProps
>(({ edges, ...props }, ref) => {
  const nativeEdges = useMemo(() => {
    if (edges == null) {
      return defaultEdges;
    }

    const edgesObj = Array.isArray(edges)
      ? edges.reduce<EdgeRecord>((acc, edge: Edge) => {
          acc[edge] = 'additive';
          return acc;
        }, {})
      : // ts has trouble with refining readonly arrays.
        (edges as EdgeRecord);

    // make sure that we always pass all edges, required for fabric
    const requiredEdges: Record<Edge, EdgeMode> = {
      top: edgesObj.top ?? 'off',
      right: edgesObj.right ?? 'off',
      bottom: edgesObj.bottom ?? 'off',
      left: edgesObj.left ?? 'off',
    };

    return requiredEdges;
  }, [edges]);

  return <NativeSafeAreaView {...props} edges={nativeEdges} ref={ref} />;
});

// When core reports safe area insets itself (see ./coreSafeAreaInsets), the
// JS implementation the library already uses on web works on every platform:
// the provider distributes insets through context and this component applies
// them per-edge as padding or margin. Sync dispatch in core keeps the
// same-frame behavior the native shadow node implementation had.
export const SafeAreaView = SUPPORTS_CORE_SAFE_AREA_INSETS
  ? (JSSafeAreaView as typeof NativeBackedSafeAreaView)
  : NativeBackedSafeAreaView;
