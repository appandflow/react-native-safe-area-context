export const docs =
  'https://appandflow.github.io/react-native-safe-area-context/';
export const github =
  'https://github.com/AppAndFlow/react-native-safe-area-context';
export const command = 'npm install react-native-safe-area-context';
export const features = [
  {
    icon: 'layout.svg',
    title: 'Build layouts your way',
    description:
      'Use safe area insets directly from JavaScript instead of calculating offsets for different devices. Set the padding or margins you want and let the safe area handle the rest.',
    href: `${docs}api/use-safe-area-insets`,
  },
  {
    icon: 'platforms.svg',
    title: 'Same API across platforms',
    description:
      'Handle safe areas on iOS, Android, and web without writing separate logic for each platform.',
    href: `${docs}usage`,
  },
  {
    icon: 'rotation.svg',
    title: 'Better handling during rotation',
    description:
      'SafeAreaView applies safe area insets natively, so your layout can update when the device rotates without waiting for a JavaScript update.',
    href: `${docs}api/safe-area-view`,
  },
];
