/* eslint-env browser */

import * as React from 'react';
import { View } from 'react-native';
import type { NativeSafeAreaProviderProps } from './SafeArea.types';

const CSSTransitions: Record<string, string> = {
  WebkitTransition: 'webkitTransitionEnd',
  Transition: 'transitionEnd',
  MozTransition: 'transitionend',
  MSTransition: 'msTransitionEnd',
  OTransition: 'oTransitionEnd',
};

export function NativeSafeAreaProvider({
  children,
  style,
  onInsetsChange,
}: NativeSafeAreaProviderProps) {
  const viewRef = React.useRef<View>(null);

  React.useEffect(() => {
    // Skip for SSR.
    if (typeof document === 'undefined') {
      return;
    }

    // On react-native-web the view ref is the underlying DOM element.
    const providerElement = viewRef.current as unknown as HTMLElement | null;
    // When the provider element cannot be measured or observed, insets and
    // frame stay based on the window instead of the provider view.
    const canMeasureProviderElement =
      typeof ResizeObserver !== 'undefined' &&
      providerElement != null &&
      typeof providerElement.getBoundingClientRect === 'function';

    const element = createContextElement();
    document.body.appendChild(element);
    const onEnd = () => {
      const { paddingTop, paddingBottom, paddingLeft, paddingRight } =
        window.getComputedStyle(element);

      const windowInsets = {
        top: paddingTop ? parseInt(paddingTop, 10) : 0,
        bottom: paddingBottom ? parseInt(paddingBottom, 10) : 0,
        left: paddingLeft ? parseInt(paddingLeft, 10) : 0,
        right: paddingRight ? parseInt(paddingRight, 10) : 0,
      };

      let insets = windowInsets;
      let frame = {
        x: 0,
        y: 0,
        width: document.documentElement.offsetWidth,
        height: document.documentElement.offsetHeight,
      };

      if (canMeasureProviderElement) {
        // Match the native implementations: report the provider view's frame
        // in viewport coordinates and clamp the window insets to the part
        // overlapping the provider view.
        const rect = providerElement.getBoundingClientRect();
        insets = {
          top: Math.max(0, windowInsets.top - rect.top),
          bottom: Math.max(
            0,
            windowInsets.bottom - (window.innerHeight - rect.bottom),
          ),
          left: Math.max(0, windowInsets.left - rect.left),
          right: Math.max(
            0,
            windowInsets.right - (window.innerWidth - rect.right),
          ),
        };
        frame = {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        };
      }

      // @ts-ignore: missing properties
      onInsetsChange({ nativeEvent: { insets, frame } });
    };
    element.addEventListener(getSupportedTransitionEvent(), onEnd);
    window.addEventListener('resize', onEnd);
    onEnd();

    let resizeObserver: ResizeObserver | null = null;
    if (canMeasureProviderElement) {
      // Note this only observes size changes. Position-only changes (an
      // ancestor scrolling or a layout shift that moves the element without
      // resizing it) are not re-reported until the next resize or env()
      // change. This matches the native implementations, which are driven
      // by layout and inset change events, and keeps scrolling free of
      // per-frame measurement work.
      resizeObserver = new ResizeObserver(onEnd);
      resizeObserver.observe(providerElement);
    }

    return () => {
      element.removeEventListener(getSupportedTransitionEvent(), onEnd);
      window.removeEventListener('resize', onEnd);
      resizeObserver?.disconnect();
      element.remove();
    };
  }, [onInsetsChange]);

  return (
    <View ref={viewRef} style={style}>
      {children}
    </View>
  );
}

let _supportedTransitionEvent: string | null | undefined = null;
function getSupportedTransitionEvent(): string {
  if (_supportedTransitionEvent != null) {
    return _supportedTransitionEvent;
  }
  const element = document.createElement('invalidtype');

  _supportedTransitionEvent = CSSTransitions.Transition;
  for (const key in CSSTransitions) {
    if (element.style[key as keyof CSSStyleDeclaration] !== undefined) {
      _supportedTransitionEvent = CSSTransitions[key];
      break;
    }
  }
  return _supportedTransitionEvent as string;
}

type CssEnv = 'constant' | 'env';

let _supportedEnv: CssEnv | null = null;
function getSupportedEnv(): CssEnv {
  if (_supportedEnv !== null) {
    return _supportedEnv;
  }
  const { CSS } = window;
  if (
    CSS &&
    CSS.supports &&
    CSS.supports('top: constant(safe-area-inset-top)')
  ) {
    _supportedEnv = 'constant';
  } else {
    _supportedEnv = 'env';
  }
  return _supportedEnv;
}

function getInset(side: string): string {
  return `${getSupportedEnv()}(safe-area-inset-${side})`;
}

function createContextElement(): HTMLElement {
  const element = document.createElement('div');
  const { style } = element;
  style.position = 'fixed';
  style.left = '0';
  style.top = '0';
  style.width = '0';
  style.height = '0';
  style.zIndex = '-1';
  style.overflow = 'hidden';
  style.visibility = 'hidden';
  // Bacon: Anything faster than this and the callback will be invoked too early with the wrong insets
  style.transitionDuration = '0.05s';
  style.transitionProperty = 'padding';
  style.transitionDelay = '0s';
  style.paddingTop = getInset('top');
  style.paddingBottom = getInset('bottom');
  style.paddingLeft = getInset('left');
  style.paddingRight = getInset('right');
  return element;
}
