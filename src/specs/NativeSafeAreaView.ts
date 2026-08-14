import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import {
  type CodegenTypes,
  type HostComponent,
  type ViewProps,
} from 'react-native';

export interface NativeProps extends ViewProps {
  mode?: CodegenTypes.WithDefault<'padding' | 'margin', 'padding'>;
  edges?: Readonly<{
    top: string;
    right: string;
    bottom: string;
    left: string;
  }>;
}

export default codegenNativeComponent<NativeProps>('RNCSafeAreaView', {
  interfaceOnly: true,
}) as HostComponent<NativeProps>;
