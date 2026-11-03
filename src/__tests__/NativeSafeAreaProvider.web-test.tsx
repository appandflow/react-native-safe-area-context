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

jest.mock('react-native', () => {
  const ReactActual = jest.requireActual<typeof React>('react');
  return {
    View: ReactActual.forwardRef<
      HTMLDivElement,
      { children?: React.ReactNode }
    >(function View({ children }, ref) {
      return ReactActual.createElement('div', { ref }, children);
    }),
  };
});

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

let root: Root | null = null;
let host: HTMLElement | null = null;
let rectMock: ReturnType<typeof spyOnBoundingClientRect>;

function mount(element: React.ReactElement) {
  const newHost = document.createElement('div');
  document.body.appendChild(newHost);
  const newRoot = createRoot(newHost);
  act(() => {
    newRoot.render(element);
  });
  root = newRoot;
  host = newHost;
}

function mountProvider(onInsetsChange: InsetChangeNativeCallback) {
  mount(<NativeSafeAreaProvider onInsetsChange={onInsetsChange} />);
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

  it('measures a window resize that moves the provider without resizing it', () => {
    setWindowDimensions(1280, WINDOW_HEIGHT);
    rectMock.mockReturnValue(makeRect(340, 0, 600, WINDOW_HEIGHT));
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mountProvider(onInsetsChange);
    // A centered provider moves as the window narrows, and no element it
    // observes changes size.
    setWindowDimensions(900, WINDOW_HEIGHT);
    rectMock.mockReturnValue(makeRect(150, 0, 600, WINDOW_HEIGHT));
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(lastMetrics(onInsetsChange).frame).toEqual({
      x: 150,
      y: 0,
      width: 600,
      height: WINDOW_HEIGHT,
    });
  });

  it('reports a window resize that changes the insets and leaves the frame as it was', () => {
    rectMock.mockReturnValue(makeRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT));
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mountProvider(onInsetsChange);
    mockWindowInsets({ top: 0, bottom: 21, left: 44, right: 44 });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(lastMetrics(onInsetsChange)).toEqual({
      insets: { top: 0, bottom: 21, left: 44, right: 44 },
      frame: { x: 0, y: 0, width: WINDOW_WIDTH, height: WINDOW_HEIGHT },
    });
  });

  it('does not report metrics that did not change', () => {
    rectMock.mockReturnValue(makeRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT));
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mountProvider(onInsetsChange);
    const callCount = onInsetsChange.mock.calls.length;
    triggerResizeObservers();
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(onInsetsChange).toHaveBeenCalledTimes(callCount);
  });

  it('measures nested providers from one window resize listener', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const outerInsetsChange = jest.fn<InsetChangeNativeCallback>();
    const innerInsetsChange = jest.fn<InsetChangeNativeCallback>();
    mount(
      <NativeSafeAreaProvider onInsetsChange={outerInsetsChange}>
        <NativeSafeAreaProvider onInsetsChange={innerInsetsChange} />
      </NativeSafeAreaProvider>,
    );
    const resizeListeners = addEventListenerSpy.mock.calls
      .filter(([type]) => type === 'resize')
      .map(([, listener]) => listener);
    expect(resizeListeners).toHaveLength(1);

    setWindowDimensions(1280, 800);
    rectMock.mockReturnValue(makeRect(0, 0, 1280, 800));
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    for (const onInsetsChange of [outerInsetsChange, innerInsetsChange]) {
      expect(lastMetrics(onInsetsChange).frame).toEqual({
        x: 0,
        y: 0,
        width: 1280,
        height: 800,
      });
    }

    const currentRoot = root;
    act(() => {
      currentRoot?.unmount();
    });
    root = null;
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      resizeListeners[0],
    );
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
});
