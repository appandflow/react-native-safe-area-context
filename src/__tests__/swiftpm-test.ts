// Guards Package.swift and its packaging. React Native's SwiftPM autolinker
// (>= 0.87) consumes the manifest as-is: it derives the product name from the
// npm package name, resolves the React Native packages by relative path, and
// leaves a manifest a library ships itself alone. Drift in any of those makes
// an app fail to resolve or fail to link.
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MANIFEST = path.join(REPO_ROOT, 'Package.swift');

type Dependency = {
  nameForTargetDependencyResolutionOnly?: string;
  path?: string;
  fileSystem?: Dependency[];
};

type Dump = {
  toolsVersion: { _version: string };
  cxxLanguageStandard: string | null;
  platforms: { platformName: string; version: string }[];
  products: { name: string; targets: string[]; type: { library?: string[] } }[];
  dependencies: Dependency[];
  targets: {
    name: string;
    path: string;
    sources: string[];
    exclude: string[];
    publicHeadersPath: string | null;
    dependencies: { product?: unknown[] }[];
    settings: {
      tool: string;
      kind: Record<string, { _0: unknown }>;
      condition?: { config?: string };
    }[];
  }[];
};

function contract(dump: Dump) {
  return {
    toolsVersion: dump.toolsVersion._version,
    cxxLanguageStandard: dump.cxxLanguageStandard,
    platforms: dump.platforms.map((each) => [each.platformName, each.version]),
    products: dump.products.map((product) => ({
      name: product.name,
      targets: product.targets,
      library: product.type.library,
    })),
    dependencies: dump.dependencies
      .flatMap((dependency) => dependency.fileSystem ?? [dependency])
      .map((each) => [each.nameForTargetDependencyResolutionOnly, each.path]),
    targets: dump.targets.map((target) => ({
      name: target.name,
      path: target.path,
      sources: target.sources,
      exclude: target.exclude,
      publicHeadersPath: target.publicHeadersPath,
      products: target.dependencies.map((each) => each.product?.slice(0, 2)),
      settings: target.settings.flatMap((setting) =>
        Object.entries(setting.kind).map(([kind, value]) =>
          [setting.tool, kind, value._0, setting.condition?.config].filter(
            (part) => part !== undefined,
          ),
        ),
      ),
    })),
  };
}

let hasSwift = process.platform === 'darwin';
try {
  if (hasSwift) {
    execFileSync('xcrun', ['--find', 'swift'], { stdio: 'ignore' });
  }
} catch {
  hasSwift = false;
}

describe('Package.swift', () => {
  it('is a hand-written manifest for Swift 6 tools', () => {
    const source = fs.readFileSync(MANIFEST, 'utf8');
    expect(source.split('\n')[0]).toBe('// swift-tools-version: 6.0');
    expect(source).not.toMatch(/AUTO-(SCAFFOLDED|GENERATED)/);
  });
});

(hasSwift ? describe : describe.skip)(
  'Package.swift evaluated by SwiftPM',
  () => {
    let scratchPath: string;
    let dump: Dump;

    beforeAll(() => {
      scratchPath = fs.mkdtempSync(path.join(os.tmpdir(), 'rnsac-spm-'));
      dump = JSON.parse(
        execFileSync(
          'swift',
          ['package', '--scratch-path', scratchPath, 'dump-package'],
          { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
        ),
      ) as Dump;
    }, 300_000);

    afterAll(() => {
      if (scratchPath) {
        fs.rmSync(scratchPath, { force: true, recursive: true });
      }
    });

    it('matches the React Native autolinking contract', () => {
      expect(contract(dump)).toEqual({
        toolsVersion: '6.0.0',
        cxxLanguageStandard: 'c++20',
        platforms: [['ios', '15.0']],
        products: [
          {
            name: 'ReactNativeSafeAreaContext',
            targets: ['ReactNativeSafeAreaContext'],
            library: ['automatic'],
          },
        ],
        dependencies: [
          ['ReactNative', path.resolve(REPO_ROOT, '../../../../xcframeworks')],
          ['React-GeneratedCode', path.resolve(REPO_ROOT, '../../../ios')],
        ],
        targets: [
          {
            name: 'ReactNativeSafeAreaContext',
            path: '.',
            sources: ['ios', 'common/cpp'],
            exclude: ['ios/RNSafeAreaContext.xcodeproj'],
            publicHeadersPath: 'ios',
            products: [
              ['ReactHeaders', 'ReactNative'],
              ['ReactNativeHeaders', 'ReactNative'],
              ['ReactNativeDependenciesHeaders', 'ReactNative'],
              ['ReactAppHeaders', 'React-GeneratedCode'],
            ],
            settings: [
              ['c', 'headerSearchPath', 'common/cpp'],
              ['c', 'headerSearchPath', 'ios'],
              ['cxx', 'headerSearchPath', 'common/cpp'],
              ['cxx', 'headerSearchPath', 'ios'],
              ['cxx', 'define', 'DEBUG', 'debug'],
              ['cxx', 'define', 'NDEBUG', 'release'],
              ['linker', 'linkedFramework', 'UIKit'],
              ['linker', 'linkedFramework', 'Foundation'],
              ['linker', 'linkedFramework', 'CoreGraphics'],
            ],
          },
        ],
      });
    });

    it('references only paths that exist', () => {
      const referenced = dump.targets.flatMap((target) =>
        [...target.sources, ...target.exclude].map((entry) =>
          path.join(REPO_ROOT, target.path, entry),
        ),
      );
      expect(referenced.filter((entry) => !fs.existsSync(entry))).toEqual([]);
    });
  },
);

describe('npm package', () => {
  it('ships the manifest but no local SwiftPM state', () => {
    // npm 10 runs `prepare` (bob build) despite --ignore-scripts; keeping
    // scripts in the background keeps their output out of the JSON on stdout.
    const packed = execFileSync(
      'npm',
      [
        'pack',
        '--dry-run',
        '--json',
        '--ignore-scripts',
        '--foreground-scripts=false',
      ],
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
    );
    const [tarball] = JSON.parse(packed) as { files: { path: string }[] }[];
    const files = tarball?.files.map((file) => file.path) ?? [];

    expect(files).toEqual(
      expect.arrayContaining([
        'Package.swift',
        'react-native-safe-area-context.podspec',
      ]),
    );
    expect(
      files.filter(
        (file) => file === 'Package.resolved' || file.startsWith('.build/'),
      ),
    ).toEqual([]);
  }, 300_000);
});
