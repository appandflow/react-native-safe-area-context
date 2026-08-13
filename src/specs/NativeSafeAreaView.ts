import { codegenNativeComponent } from 'react-native';
import type { CodegenTypes, ViewProps, HostComponent } from 'react-native';

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
