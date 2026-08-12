/**
 * @jest-environment jsdom
 */

import { describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import * as React from 'react';
import { NativeSafeAreaProvider } from '../NativeSafeAreaProvider.web';
import type { InsetChangeNativeCallback } from '../SafeArea.types';

const setDocumentDimensions = (width: number, height: number) => {
  Object.defineProperty(document.documentElement, 'offsetWidth', {
    configurable: true,
    value: width,
  });
  Object.defineProperty(document.documentElement, 'offsetHeight', {
    configurable: true,
    value: height,
  });
};

const mockComputedPadding = (padding: {
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
}) => {
  jest
    .spyOn(window, 'getComputedStyle')
    .mockReturnValue(padding as unknown as CSSStyleDeclaration);
};

describe('NativeSafeAreaProvider.web', () => {
  it('updates insets and frame on window resize', () => {
    setDocumentDimensions(800, 600);
    mockComputedPadding({
      paddingTop: '20px',
      paddingBottom: '10px',
      paddingLeft: '0px',
      paddingRight: '0px',
    });
    const onInsetsChange = jest.fn<InsetChangeNativeCallback>();
    render(<NativeSafeAreaProvider onInsetsChange={onInsetsChange} />);
    expect(onInsetsChange).toHaveBeenCalledWith({
      nativeEvent: {
        insets: { top: 20, bottom: 10, left: 0, right: 0 },
        frame: { x: 0, y: 0, width: 800, height: 600 },
      },
    });

    onInsetsChange.mockClear();
    setDocumentDimensions(1024, 768);
    mockComputedPadding({
      paddingTop: '40px',
      paddingBottom: '10px',
      paddingLeft: '0px',
      paddingRight: '0px',
    });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(onInsetsChange).toHaveBeenCalledWith({
      nativeEvent: {
        insets: { top: 40, bottom: 10, left: 0, right: 0 },
        frame: { x: 0, y: 0, width: 1024, height: 768 },
      },
    });
  });
});
