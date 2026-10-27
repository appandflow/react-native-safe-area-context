import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const packageName = 'react-native-safe-area-context';
export const repositoryUrl =
  'git+https://github.com/appandflow/react-native-safe-area-context.git';

export function checkRelease(manifest, tag) {
  if (manifest.name !== packageName || manifest.private) {
    throw new Error(
      'Expected the public react-native-safe-area-context package.',
    );
  }
  if (manifest.repository?.url !== repositoryUrl) {
    throw new Error(
      'Repository URL must match GitHub casing for npm provenance.',
    );
  }
  if (manifest.publishConfig?.registry !== 'https://registry.npmjs.org/') {
    throw new Error('Package registry must be the public npm registry.');
  }
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version)) {
    throw new Error('Expected a release version without build metadata.');
  }
  if (tag !== undefined && tag !== `v${manifest.version}`) {
    throw new Error('Release tag must exactly match the package version.');
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length > 3)
    throw new Error('Provide at most one release tag.');
  const manifest = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );
  checkRelease(manifest, process.argv[2]);
  console.log(
    `${manifest.name}@${manifest.version}: release metadata verified`,
  );
}
