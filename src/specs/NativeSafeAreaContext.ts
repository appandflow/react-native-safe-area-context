import { TurboModule, TurboModuleRegistry } from 'react-native';
import type { CodegenTypes } from 'react-native';

export interface Spec extends TurboModule {
  getConstants: () => {
    initialWindowMetrics?: {
      insets: {
        top: CodegenTypes.Double;
        right: CodegenTypes.Double;
        bottom: CodegenTypes.Double;
        left: CodegenTypes.Double;
      };
      frame: {
        x: CodegenTypes.Double;
        y: CodegenTypes.Double;
        width: CodegenTypes.Double;
        height: CodegenTypes.Double;
      };
    };
  };
}

export default TurboModuleRegistry.get<Spec>('RNCSafeAreaContext');
