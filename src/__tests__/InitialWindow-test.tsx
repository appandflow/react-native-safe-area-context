import { describe, expect, it, jest } from '@jest/globals';
import type { Metrics } from '../SafeArea.types';

describe('InitialWindow', () => {
  describe('initialWindowMetrics', () => {
    it('is null when the window safe area insets are not available', () => {
      jest.resetModules();
      expect(require('../InitialWindow').initialWindowMetrics).toBe(null);
    });

    it('uses the window metrics from the Dimensions module', () => {
      jest.resetModules();
      const { Dimensions } = require('react-native');
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 100,
        height: 100,
        scale: 2,
        fontScale: 1,
        safeAreaInsets: { top: 20, right: 0, bottom: 0, left: 0 },
      });

      expect(require('../InitialWindow').initialWindowMetrics).toEqual({
        insets: { top: 20, right: 0, bottom: 0, left: 0 },
        frame: { x: 0, y: 0, width: 100, height: 100 },
      });
    });

    it('uses the constant provided by the native module on older React Native', () => {
      jest.resetModules();
      jest.doMock('../coreSafeAreaInsets', () => ({
        ...jest.requireActual<object>('../coreSafeAreaInsets'),
        SUPPORTS_CORE_SAFE_AREA_INSETS: false,
      }));
      const testMetrics: Metrics = {
        insets: {
          top: 20,
          left: 0,
          right: 0,
          bottom: 0,
        },
        frame: {
          x: 0,
          y: 0,
          height: 100,
          width: 100,
        },
      };
      const TurboModuleRegistry = require('react-native/Libraries/TurboModule/TurboModuleRegistry');
      TurboModuleRegistry.get = jest.fn((name) => {
        if (name === 'RNCSafeAreaContext') {
          return {
            getConstants() {
              return {
                initialWindowMetrics: testMetrics,
              };
            },
          };
        }
        return null;
      });

      expect(require('../InitialWindow').initialWindowMetrics).toBe(
        testMetrics,
      );
      expect(TurboModuleRegistry.get).toBeCalledWith('RNCSafeAreaContext');
      jest.dontMock('../coreSafeAreaInsets');
    });
  });
});
