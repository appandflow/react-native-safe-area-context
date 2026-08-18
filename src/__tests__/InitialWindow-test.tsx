import { describe, expect, it, jest } from '@jest/globals';
import type { Metrics } from '../SafeArea.types';

describe('InitialWindow', () => {
  describe('initialWindowMetrics', () => {
    it('is null when no view config is available', () => {
      jest.resetModules();
      expect(require('../InitialWindow').initialWindowMetrics).toBe(null);
    });

    it('it uses the constant provided by the view config', () => {
      jest.resetModules();
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
      const { TurboModuleRegistry } = require('react-native');
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
    });
  });
});
