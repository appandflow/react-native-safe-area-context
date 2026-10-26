import {
  TurboModuleRegistry,
  type CodegenTypes,
  type TurboModule,
} from 'react-native';

export interface Spec extends TurboModule {
  getConstants: () => {
    initialWindowMetrics?: {
      insets: {
        top: CodegenTypes.Double;
        right: CodegenTypes.Double;
        bottom: CodegenTypes.Double;
        left: CodegenTypes.Double;
      };
      verticalCornerAdaptedInsets: {
        top: Double;
        right: Double;
        bottom: Double;
        left: Double;
      };
      horizontalCornerAdaptedInsets: {
        top: Double;
        right: Double;
        bottom: Double;
        left: Double;
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
