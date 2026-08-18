import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import {
  type CodegenTypes,
  type HostComponent,
  type ViewProps,
} from 'react-native';

export type Event = Readonly<{
  insets: Readonly<{
    top: CodegenTypes.Double;
    right: CodegenTypes.Double;
    bottom: CodegenTypes.Double;
    left: CodegenTypes.Double;
  }>;
  frame: Readonly<{
    x: CodegenTypes.Double;
    y: CodegenTypes.Double;
    width: CodegenTypes.Double;
    height: CodegenTypes.Double;
  }>;
}>;

export interface NativeProps extends ViewProps {
  onInsetsChange?: CodegenTypes.DirectEventHandler<Event>;
}

export default codegenNativeComponent<NativeProps>(
  'RNCSafeAreaProvider',
) as HostComponent<NativeProps>;
