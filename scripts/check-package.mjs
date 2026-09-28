import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { checkRelease } from './check-release.mjs';

const tarball = process.argv[2];
if (!tarball || process.argv.length !== 3) {
  throw new Error('Provide exactly one package tarball.');
}

const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
  .trim()
  .split('\n');
const manifest = JSON.parse(
  execFileSync('tar', ['-xOf', tarball, 'package/package.json'], {
    encoding: 'utf8',
  }),
);
const source = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

if (manifest.name !== source.name || manifest.version !== source.version) {
  throw new Error('Packed manifest name or version differs from the source.');
}

checkRelease(manifest);

for (const required of [
  'README.md',
  'LICENSE',
  'src/index.tsx',
  'src/specs/NativeSafeAreaProvider.ts',
  'src/specs/NativeSafeAreaView.ts',
  'lib/commonjs/index.js',
  'lib/module/index.js',
  'lib/typescript/src/index.d.ts',
  'react-native-safe-area-context.podspec',
  'Package.swift',
  'react-native.config.js',
  'ios/RNCSafeAreaContext.mm',
  'android/build.gradle',
  'common/cpp/react/renderer/components/safeareacontext/RNCSafeAreaViewShadowNode.cpp',
  'jest/mock.js',
]) {
  if (!entries.includes(`package/${required}`)) {
    throw new Error(`Missing package file: ${required}`);
  }
}

for (const field of ['main', 'module', 'types', 'react-native', 'source']) {
  const target = manifest[field];
  if (!target || !entries.includes(`package/${target.replace(/^\.\//, '')}`)) {
    throw new Error(`Missing ${field} target: ${target ?? '<unset>'}`);
  }
}

for (const entry of entries) {
  if (/^package\/(?:android|ios)\/(?:.*\/)?build\//.test(entry)) {
    throw new Error(`Unexpected native build output: ${entry}`);
  }
  if (
    /^package\/(?:example|docs|node_modules|scripts|artifacts|\.github)(?:\/|$)/.test(
      entry,
    ) ||
    /^package\/(?:src|lib\/(?:commonjs|module|typescript)\/src)\/__tests__(?:\/|$)/.test(
      entry,
    )
  ) {
    throw new Error(`Unexpected repository-only file: ${entry}`);
  }
}

for (const group of [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]) {
  for (const range of Object.values(manifest[group] ?? {})) {
    if (typeof range === 'string' && range.startsWith('workspace:')) {
      throw new Error('Unresolved workspace range in tarball.');
    }
  }
}

console.log(
  `${manifest.name}@${manifest.version}: ${entries.length} package files verified`,
);
