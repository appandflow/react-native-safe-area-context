import * as React from 'react';
import {
  Dimensions,
  StyleSheet,
  type View,
  type ViewProps,
} from 'react-native';
import { NativeSafeAreaProvider } from './NativeSafeAreaProvider';
import type {
  CornerAdaptation,
  EdgeInsets,
  InsetChangedEvent,
  Metrics,
  Rect,
} from './SafeArea.types';

const isDev = process.env.NODE_ENV !== 'production';

export const SafeAreaInsetsContext = React.createContext<EdgeInsets | null>(
  null,
);
if (isDev) {
  SafeAreaInsetsContext.displayName = 'SafeAreaInsetsContext';
}

export const SafeAreaFrameContext = React.createContext<Rect | null>(null);
if (isDev) {
  SafeAreaFrameContext.displayName = 'SafeAreaFrameContext';
}

export const SafeAreaVerticalCornerAdaptedInsetsContext =
  React.createContext<EdgeInsets | null>(null);
if (isDev) {
  SafeAreaVerticalCornerAdaptedInsetsContext.displayName =
    'SafeAreaVerticalCornerAdaptedInsetsContext';
}

export const SafeAreaHorizontalCornerAdaptedInsetsContext =
  React.createContext<EdgeInsets | null>(null);
if (isDev) {
  SafeAreaHorizontalCornerAdaptedInsetsContext.displayName =
    'SafeAreaHorizontalCornerAdaptedInsetsContext';
}

export interface SafeAreaProviderProps extends ViewProps {
  ref?: React.Ref<View>;
  children?: React.ReactNode;
  initialMetrics?: Metrics | null;
  /**
   * @deprecated
   */
  initialSafeAreaInsets?: EdgeInsets | null;
}

export function SafeAreaProvider({
  children,
  initialMetrics,
  initialSafeAreaInsets,
  style,
  ref,
  ...others
}: SafeAreaProviderProps) {
  const parentInsets = useParentSafeAreaInsets();
  const parentFrame = useParentSafeAreaFrame();
  const parentVerticalInsets = React.useContext(
    SafeAreaVerticalCornerAdaptedInsetsContext,
  );
  const parentHorizontalInsets = React.useContext(
    SafeAreaHorizontalCornerAdaptedInsetsContext,
  );
  const [insets, setInsets] = React.useState<EdgeInsets | null>(
    initialMetrics?.insets ?? initialSafeAreaInsets ?? parentInsets ?? null,
  );
  const [verticalInsets, setVerticalInsets] = React.useState<EdgeInsets | null>(
    initialMetrics
      ? (initialMetrics.verticalCornerAdaptedInsets ?? initialMetrics.insets)
      : (initialSafeAreaInsets ?? parentVerticalInsets ?? null),
  );
  const [horizontalInsets, setHorizontalInsets] =
    React.useState<EdgeInsets | null>(
      initialMetrics
        ? (initialMetrics.horizontalCornerAdaptedInsets ??
            initialMetrics.insets)
        : (initialSafeAreaInsets ?? parentHorizontalInsets ?? null),
    );
  const [frame, setFrame] = React.useState<Rect>(
    initialMetrics?.frame ??
      parentFrame ?? {
        // Backwards compat so we render anyway if we don't have frame.
        x: 0,
        y: 0,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
      },
  );
  const onInsetsChange = React.useCallback((event: InsetChangedEvent) => {
    const {
      nativeEvent: {
        frame: nextFrame,
        insets: nextInsets,
        verticalCornerAdaptedInsets: nextVerticalInsets = nextInsets,
        horizontalCornerAdaptedInsets: nextHorizontalInsets = nextInsets,
      },
    } = event;

    setFrame((curFrame) => {
      if (
        // Backwards compat with old native code that won't send frame.
        nextFrame &&
        (nextFrame.height !== curFrame.height ||
          nextFrame.width !== curFrame.width ||
          nextFrame.x !== curFrame.x ||
          nextFrame.y !== curFrame.y)
      ) {
        return nextFrame;
      } else {
        return curFrame;
      }
    });

    setInsets((curInsets) => pickInsets(curInsets, nextInsets));
    setVerticalInsets((curInsets) => pickInsets(curInsets, nextVerticalInsets));
    setHorizontalInsets((curInsets) =>
      pickInsets(curInsets, nextHorizontalInsets),
    );
  }, []);

  return (
    <NativeSafeAreaProvider
      ref={ref}
      style={[styles.fill, style]}
      onInsetsChange={onInsetsChange}
      {...others}
    >
      {insets != null ? (
        <SafeAreaFrameContext.Provider value={frame}>
          <SafeAreaInsetsContext.Provider value={insets}>
            <SafeAreaVerticalCornerAdaptedInsetsContext.Provider
              value={verticalInsets ?? insets}
            >
              <SafeAreaHorizontalCornerAdaptedInsetsContext.Provider
                value={horizontalInsets ?? insets}
              >
                {children}
              </SafeAreaHorizontalCornerAdaptedInsetsContext.Provider>
            </SafeAreaVerticalCornerAdaptedInsetsContext.Provider>
          </SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      ) : null}
    </NativeSafeAreaProvider>
  );
}

export interface SafeAreaListenerProps extends ViewProps {
  onChange: (data: { insets: EdgeInsets; frame: Rect }) => void;
}

export function SafeAreaListener({
  onChange,
  style,
  children,
  ...others
}: SafeAreaListenerProps) {
  return (
    <NativeSafeAreaProvider
      {...others}
      style={[styles.fill, style]}
      onInsetsChange={(e) => {
        onChange({
          insets: e.nativeEvent.insets,
          frame: e.nativeEvent.frame,
        });
      }}
    >
      {children}
    </NativeSafeAreaProvider>
  );
}

function pickInsets(
  curInsets: EdgeInsets | null,
  nextInsets: EdgeInsets,
): EdgeInsets {
  if (
    !curInsets ||
    nextInsets.bottom !== curInsets.bottom ||
    nextInsets.left !== curInsets.left ||
    nextInsets.right !== curInsets.right ||
    nextInsets.top !== curInsets.top
  ) {
    return nextInsets;
  } else {
    return curInsets;
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

function useParentSafeAreaInsets(): EdgeInsets | null {
  return React.useContext(SafeAreaInsetsContext);
}

function useParentSafeAreaFrame(): Rect | null {
  return React.useContext(SafeAreaFrameContext);
}

const NO_INSETS_ERROR =
  'No safe area value available. Make sure you are rendering `<SafeAreaProvider>` at the top of your app.';

export interface UseSafeAreaInsetsOptions {
  /**
   * Return the safe area insets enlarged on the edges of this axis where the
   * display's rounded corners reach past the regular safe area.
   */
  cornerAdaptation?: CornerAdaptation;
}

function getInsetsContext(cornerAdaptation: CornerAdaptation | undefined) {
  switch (cornerAdaptation) {
    case 'vertical':
      return SafeAreaVerticalCornerAdaptedInsetsContext;
    case 'horizontal':
      return SafeAreaHorizontalCornerAdaptedInsetsContext;
    default:
      return SafeAreaInsetsContext;
  }
}

export function useSafeAreaInsets(
  options?: UseSafeAreaInsetsOptions,
): EdgeInsets {
  const insets = React.useContext(getInsetsContext(options?.cornerAdaptation));
  if (insets == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return insets;
}

export function useSafeAreaFrame(): Rect {
  const frame = React.useContext(SafeAreaFrameContext);
  if (frame == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return frame;
}

export type WithSafeAreaInsetsProps = {
  insets: EdgeInsets;
};

export function withSafeAreaInsets<T>(
  WrappedComponent: React.ComponentType<
    (React.PropsWithoutRef<T> | T) & WithSafeAreaInsetsProps
  >,
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<T> & React.RefAttributes<unknown>
> {
  return React.forwardRef<unknown, T>((props, ref) => {
    const insets = useSafeAreaInsets();
    return <WrappedComponent {...props} insets={insets} ref={ref} />;
  });
}

/**
 * @deprecated
 */
export function useSafeArea(): EdgeInsets {
  return useSafeAreaInsets();
}

/**
 * @deprecated
 */
export const SafeAreaConsumer = SafeAreaInsetsContext.Consumer;

/**
 * @deprecated
 */
export const SafeAreaContext = SafeAreaInsetsContext;
