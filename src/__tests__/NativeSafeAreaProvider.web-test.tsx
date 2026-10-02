/**
 * @jest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act -- this file renders with react-dom, not testing-library */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type {
  EdgeInsets,
  InsetChangeNativeCallback,
  Metrics,
} from '../SafeArea.types';
import { NativeSafeAreaProvider } from '../NativeSafeAreaProvider.web';
import { SafeAreaListener } from '../SafeAreaContext';

jest.mock('react-native', () => {
  const ReactActual = jest.requireActual<typeof React>('react');
  return {
    View: ReactActual.forwardRef<
      HTMLDivElement,
      { children?: React.ReactNode }
    >(function View({ children }, ref) {
      return ReactActual.createElement('div', { ref }, children);
    }),
    StyleSheet: { create: <T,>(styles: T): T => styles },
    Dimensions: { get: () => ({ width: WINDOW_WIDTH, height: WINDOW_HEIGHT }) },
  };
});

// `SafeAreaContext` imports the platform-agnostic `./NativeSafeAreaProvider`,
// which the react-native jest preset resolves to the native implementation.
// Point it at the web one so this suite exercises the web code path.
jest.mock('../NativeSafeAreaProvider', () =>
  jest.requireActual('../NativeSafeAreaProvider.web'),
);

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const WINDOW_WIDTH = 1024;
const WINDOW_HEIGHT = 768;
const WINDOW_INSETS = { top: 44, bottom: 34, left: 10, right: 20 };

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];
  callback: () => void;
  constructor(callback: () => void) {
    this.callback = callback;
    ResizeObserverMock.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

function triggerResizeObservers() {
  act(() => {
    ResizeObserverMock.instances.forEach((instance) => instance.callback());
  });
}

function makeRect(
  x: number,
  y: number,
  width: number,
  height: number,
): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => null,
  } as DOMRect;
}

type OnInsetsChangeMock = ReturnType<typeof jest.fn<InsetChangeNativeCallback>>;

function lastMetrics(onInsetsChange: OnInsetsChangeMock): Metrics {
  const lastCall = onInsetsChange.mock.lastCall;
  if (lastCall == null) {
    throw new Error('onInsetsChange was not called');
  }
  return lastCall[0].nativeEvent;
}

function setWindowDimensions(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'offsetWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'offsetHeight', {
    value: height,
    configurable: true,
  });
}

function mockWindowInsets(insets: EdgeInsets) {
  jest.spyOn(window, 'getComputedStyle').mockReturnValue({
    paddingTop: `${insets.top}px`,
    paddingBottom: `${insets.bottom}px`,
    paddingLeft: `${insets.left}px`,
    paddingRight: `${insets.right}px`,
  } as CSSStyleDeclaration);
}

function spyOnBoundingClientRect() {
  return jest.spyOn(Element.prototype, 'getBoundingClientRect');
}

/**
 * Counts how many times the hidden measurement probe is attached to the
 * document. The probe is torn down and re-attached whenever the measurement
 * effect re-runs, so at any instant only one is present: the churn is only
 * visible in the number of attachments.
 */
function trackProbeAttachments(): { count: number } {
  const counter = { count: 0 };
  const appendChild = document.body.appendChild.bind(document.body);
  jest
    .spyOn(document.body, 'appendChild')
    .mockImplementation(<T extends Node>(node: T): T => {
      if (
        (node as Node as HTMLElement).style?.transitionProperty === 'padding'
      ) {
        counter.count += 1;
      }
      return appendChild(node);
    });
  return counter;
}

let root: Root | null = null;
let host: HTMLElement | null = null;
let rectMock: ReturnType<typeof spyOnBoundingClientRect>;

function mountProvider(onInsetsChange: InsetChangeNativeCallback) {
  const newHost = document.createElement('div');
  document.body.appendChild(newHost);
  const newRoot = createRoot(newHost);
  act(() => {
    newRoot.render(<NativeSafeAreaProvider onInsetsChange={onInsetsChange} />);
  });
  root = newRoot;
  host = newHost;
}

describe('NativeSafeAreaProvider.web', () => {
  beforeEach(() => {
    ResizeObserverMock.instances = [];
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver =
      ResizeObserverMock;
    setWindowDimensions(WINDOW_WIDTH, WINDOW_HEIGHT);
    mockWindowInsets(WINDOW_INSETS);
    rectMock = spyOnBoundingClientRect().mockReturnValue(
      makeRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT),
    );
  });

  afterEach(() => {
    const currentRoot = root;
    if (currentRoot != null) {
      act(() => {
        currentRoot.unmount();
      });
      root = null;
    }
    host?.remove();
    host = null;
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    jest.restoreAllMocks();
  });

  it('reports the provider element rect as the frame', () => {
    rectMock.mockReturnValue(makeRect(20, 30, 200, 300));
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mountProvider(onInsetsChange);
    expect(lastMetrics(onInsetsChange).frame).toEqual({
      x: 20,
      y: 30,
      width: 200,
      height: 300,
    });
  });

  it('reports zero insets when the provider element does not overlap the safe area', () => {
    // Element is 100px from the top edge, 168px from the bottom edge, 50px
    // from the left edge and 74px from the right edge, all larger than the
    // window insets.
    rectMock.mockReturnValue(makeRect(50, 100, 900, 500));
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mountProvider(onInsetsChange);
    expect(lastMetrics(onInsetsChange).insets).toEqual({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
  });

  it('clamps insets to the part of the safe area overlapping the provider element', () => {
    // Element is 20px from the top edge, 14px from the bottom edge, 4px from
    // the left edge and 8px from the right edge.
    rectMock.mockReturnValue(makeRect(4, 20, 1012, 734));
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mountProvider(onInsetsChange);
    expect(lastMetrics(onInsetsChange).insets).toEqual({
      top: WINDOW_INSETS.top - 20,
      bottom: WINDOW_INSETS.bottom - 14,
      left: WINDOW_INSETS.left - 4,
      right: WINDOW_INSETS.right - 8,
    });
  });

  it('reports window insets and frame for a full-viewport provider', () => {
    rectMock.mockReturnValue(makeRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT));
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mountProvider(onInsetsChange);
    expect(lastMetrics(onInsetsChange)).toEqual({
      insets: WINDOW_INSETS,
      frame: { x: 0, y: 0, width: WINDOW_WIDTH, height: WINDOW_HEIGHT },
    });
  });

  it('updates metrics when the provider element resizes', () => {
    rectMock.mockReturnValue(makeRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT));
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mountProvider(onInsetsChange);
    rectMock.mockReturnValue(makeRect(0, 100, WINDOW_WIDTH, 668));
    triggerResizeObservers();
    expect(lastMetrics(onInsetsChange)).toEqual({
      insets: {
        top: 0,
        bottom: WINDOW_INSETS.bottom,
        left: WINDOW_INSETS.left,
        right: WINDOW_INSETS.right,
      },
      frame: { x: 0, y: 100, width: WINDOW_WIDTH, height: 668 },
    });
  });

  it('updates metrics on window resize', () => {
    rectMock.mockReturnValue(makeRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT));
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mountProvider(onInsetsChange);
    // The window grows and the provider element grows with it.
    setWindowDimensions(1280, 800);
    rectMock.mockReturnValue(makeRect(0, 0, 1280, 800));
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(lastMetrics(onInsetsChange)).toEqual({
      insets: WINDOW_INSETS,
      frame: { x: 0, y: 0, width: 1280, height: 800 },
    });
  });

  it('does not update metrics on a position-only change (known limitation)', () => {
    rectMock.mockReturnValue(makeRect(0, 100, 200, 300));
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mountProvider(onInsetsChange);
    const callCount = onInsetsChange.mock.calls.length;
    // The element moves up by 80px without resizing, e.g. because an
    // ancestor scrolled or a sibling collapsed. This is intentionally not
    // observed to keep scrolling free of measurement work; metrics catch up
    // on the next resize or env() change.
    rectMock.mockReturnValue(makeRect(0, 20, 200, 300));
    act(() => {
      document.dispatchEvent(new Event('scroll'));
    });
    expect(onInsetsChange).toHaveBeenCalledTimes(callCount);
  });

  it('falls back to window metrics when ResizeObserver is not available', () => {
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    rectMock.mockReturnValue(makeRect(20, 30, 200, 300));
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mountProvider(onInsetsChange);
    expect(lastMetrics(onInsetsChange)).toEqual({
      insets: WINDOW_INSETS,
      frame: { x: 0, y: 0, width: WINDOW_WIDTH, height: WINDOW_HEIGHT },
    });

    // Window metrics still update on window resize.
    setWindowDimensions(800, 600);
    mockWindowInsets({ top: 20, bottom: 10, left: 0, right: 0 });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(lastMetrics(onInsetsChange)).toEqual({
      insets: { top: 20, bottom: 10, left: 0, right: 0 },
      frame: { x: 0, y: 0, width: 800, height: 600 },
    });
  });

  function mountRoot(): Root {
    const newHost = document.createElement('div');
    document.body.appendChild(newHost);
    const newRoot = createRoot(newHost);
    host = newHost;
    root = newRoot;
    return newRoot;
  }

  it('does not rebuild the measurement probe when the provider re-renders', () => {
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    const newRoot = mountRoot();
    const probes = trackProbeAttachments();

    // A fresh callback identity on every render, which is what an inline
    // arrow in the parent produces.
    const render = () =>
      act(() => {
        newRoot.render(
          <NativeSafeAreaProvider onInsetsChange={(e) => onInsetsChange(e)} />,
        );
      });

    render();
    render();
    render();

    expect(probes.count).toBe(1);
    expect(ResizeObserverMock.instances).toHaveLength(1);
    expect(onInsetsChange).toHaveBeenCalledTimes(1);
  });

  it('does not rebuild the measurement probe when a SafeAreaListener re-renders', () => {
    const onChange = jest.fn();
    const newRoot = mountRoot();
    const probes = trackProbeAttachments();

    // `onChange` is the same function on every render, so any churn comes
    // from `SafeAreaListener` itself and not from the caller.
    const render = () =>
      act(() => {
        newRoot.render(<SafeAreaListener onChange={onChange} />);
      });

    render();
    render();
    render();

    expect(probes.count).toBe(1);
    expect(ResizeObserverMock.instances).toHaveLength(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('reports later changes to the most recent onInsetsChange', () => {
    rectMock.mockReturnValue(makeRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT));
    const first = jest.fn<InsetChangeNativeCallback>();
    const second = jest.fn<InsetChangeNativeCallback>();
    const newRoot = mountRoot();

    const render = (onInsetsChange: InsetChangeNativeCallback) =>
      act(() => {
        newRoot.render(
          <NativeSafeAreaProvider onInsetsChange={onInsetsChange} />,
        );
      });

    render(first);
    expect(first).toHaveBeenCalledTimes(1);

    // Swapping the callback must not re-measure on its own.
    render(second);
    expect(second).not.toHaveBeenCalled();

    // A genuine change must still propagate, and to the current callback.
    rectMock.mockReturnValue(makeRect(0, 100, WINDOW_WIDTH, 668));
    triggerResizeObservers();

    expect(second).toHaveBeenCalledTimes(1);
    expect(lastMetrics(second)).toEqual({
      insets: {
        top: 0,
        bottom: WINDOW_INSETS.bottom,
        left: WINDOW_INSETS.left,
        right: WINDOW_INSETS.right,
      },
      frame: { x: 0, y: 100, width: WINDOW_WIDTH, height: 668 },
    });
    // The stale callback is not called again.
    expect(first).toHaveBeenCalledTimes(1);
  });
});
