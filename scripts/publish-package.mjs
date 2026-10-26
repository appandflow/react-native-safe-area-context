import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkRelease } from './check-release.mjs';

const registry = 'https://registry.npmjs.org/';

export function parseLookup(stdout, failed = false) {
  const result = JSON.parse(stdout);
  if (failed) {
    if (result?.error?.code === 'E404') return null;
    throw new Error(
      `Registry lookup failed: ${result?.error?.code ?? 'unknown'}`,
    );
  }
  if (
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result) ||
    result.error
  ) {
    throw new Error('Unexpected registry response; refusing to infer absence.');
  }
  return result;
}

function lookup(args) {
  try {
    return parseLookup(
      execFileSync(
        'npm',
        ['view', ...args, '--json', `--registry=${registry}`],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 30000,
        },
      ),
    );
  } catch (error) {
    // Only structured npm E404 is absence; timeouts, malformed responses,
    // authorization errors and registry outages must not trigger publication.
    if (typeof error.stdout === 'string' && error.stdout) {
      return parseLookup(error.stdout, true);
    }
    throw error;
  }
}

export function assertMatching(record, version, integrity) {
  if (record?.version !== version || record?.['dist.integrity'] !== integrity) {
    throw new Error(
      'Existing registry version differs from the verified tarball.',
    );
  }
}

export async function publishVerified({
  version,
  integrity,
  readVersion,
  readTags,
  publish,
  sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
  log = console.log,
  attempts = 40,
}) {
  const distTag = version.includes('-') ? 'next' : 'latest';
  const existing = await readVersion();
  if (existing) {
    assertMatching(existing, version, integrity);
    if (!existing['dist.attestations']?.provenance) {
      throw new Error(
        'Matching registry package has no provenance; inspect before retrying.',
      );
    }
    const tags = await readTags();
    log(
      `Version ${version} already exists with matching integrity and provenance; skipping publish. ${distTag}=${tags?.[distTag] ?? '<unset>'}.`,
    );
    return 'existing';
  }

  await publish(distTag);
  log(
    'npm accepted publication. Waiting up to ten minutes for registry processing.',
  );
  const deadline = Date.now() + 10 * 60 * 1000;
  for (
    let attempt = 0;
    attempt < attempts && Date.now() < deadline;
    attempt += 1
  ) {
    await sleep(15000);
    let record;
    let tags;
    try {
      record = await readVersion();
      if (!record) continue;
      tags = await readTags();
    } catch (error) {
      // Registry reads can fail transiently after acceptance. Never publish twice.
      log(`Verification pending: ${error.message}`);
      continue;
    }
    assertMatching(record, version, integrity);
    if (
      record['dist.attestations']?.provenance &&
      tags?.[distTag] === version
    ) {
      log(`Verified ${version}: integrity, ${distTag}, and provenance.`);
      return 'published';
    }
  }
  throw new Error(
    'npm accepted publication, but registry verification is still pending. Check the exact version before retrying. Once visible, rerun failed jobs with the same artifact; do not bump or republish blindly.',
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 4)
    throw new Error('Provide a tarball and expected version.');
  const tarball = resolve(process.argv[2]);
  const version = process.argv[3];
  const manifest = JSON.parse(
    execFileSync('tar', ['-xOf', tarball, 'package/package.json'], {
      encoding: 'utf8',
    }),
  );
  checkRelease(manifest, `v${version}`);
  const integrity = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`;
  await publishVerified({
    version,
    integrity,
    readVersion: () =>
      lookup([
        `${manifest.name}@${version}`,
        'version',
        'dist.integrity',
        'dist.attestations',
      ]),
    readTags: () => lookup([manifest.name, 'dist-tags']),
    publish: (distTag) =>
      execFileSync(
        'npm',
        [
          'publish',
          tarball,
          '--provenance',
          '--access',
          'public',
          '--tag',
          distTag,
          `--registry=${registry}`,
        ],
        { stdio: 'inherit' },
      ),
  });
}
