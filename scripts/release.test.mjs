import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRelease, packageName, repositoryUrl } from './check-release.mjs';
import { parseLookup, publishVerified } from './publish-package.mjs';

const manifest = {
  name: packageName,
  version: '5.10.1',
  repository: { url: repositoryUrl },
  publishConfig: { registry: 'https://registry.npmjs.org/' },
};
const record = {
  version: manifest.version,
  'dist.integrity': 'sha512-verified',
  'dist.attestations': {
    provenance: { predicateType: 'https://slsa.dev/provenance/v1' },
  },
};
const options = {
  version: manifest.version,
  integrity: record['dist.integrity'],
  readTags: async () => ({ latest: manifest.version }),
  sleep: async () => {},
  log: () => {},
  attempts: 3,
};

test('metadata rejects the provenance casing failure and wrong release tag', () => {
  checkRelease(manifest, 'v5.10.1');
  checkRelease(manifest);
  assert.throws(() =>
    checkRelease({
      ...manifest,
      repository: { url: repositoryUrl.replace('appandflow', 'AppAndFlow') },
    }),
  );
  assert.throws(() => checkRelease(manifest, 'v5.10.0'));
  assert.throws(() => checkRelease({ ...manifest, private: true }));
  assert.throws(() => checkRelease({ ...manifest, name: 'example' }));
});

test('only a structured E404 means missing, not auth/network/malformed failures', () => {
  assert.equal(parseLookup('{"error":{"code":"E404"}}', true), null);
  for (const code of ['E401', 'E403', 'E500', 'ECONNRESET']) {
    assert.throws(() => parseLookup(JSON.stringify({ error: { code } }), true));
  }
  assert.throws(() => parseLookup('not JSON', true));
  assert.throws(() => parseLookup('null'));
  assert.throws(() => parseLookup('[]'));
});

test('already published matching package skips publish and preserves a newer dist-tag', async () => {
  let publishes = 0;
  const result = await publishVerified({
    ...options,
    readVersion: async () => record,
    readTags: async () => ({ latest: '6.0.0' }),
    publish: async () => {
      publishes += 1;
    },
  });
  assert.equal(result, 'existing');
  assert.equal(publishes, 0);
});

test('existing mismatched package cannot be republished', async () => {
  let publishes = 0;
  await assert.rejects(
    publishVerified({
      ...options,
      readVersion: async () => ({
        ...record,
        'dist.integrity': 'sha512-other',
      }),
      publish: async () => {
        publishes += 1;
      },
    }),
  );
  assert.equal(publishes, 0);
});

test('registry outage before publish does not cause a write', async () => {
  let publishes = 0;
  await assert.rejects(
    publishVerified({
      ...options,
      readVersion: async () => {
        throw new Error('E500');
      },
      publish: async () => {
        publishes += 1;
      },
    }),
  );
  assert.equal(publishes, 0);
});

test('processing delay and transient verification error still publish exactly once', async () => {
  let reads = 0;
  const tags = [];
  const result = await publishVerified({
    ...options,
    readVersion: async () => {
      reads += 1;
      if (reads < 3) return null;
      if (reads === 3) throw new Error('temporary network failure');
      return record;
    },
    publish: async (tag) => {
      tags.push(tag);
    },
  });
  assert.equal(result, 'published');
  assert.deepEqual(tags, ['latest']);
});

test('accepted but unavailable package times out without republishing', async () => {
  let publishes = 0;
  await assert.rejects(
    publishVerified({
      ...options,
      readVersion: async () => null,
      publish: async () => {
        publishes += 1;
      },
    }),
    /accepted publication.*pending/,
  );
  assert.equal(publishes, 1);
});

test('prerelease publishes to next and requires provenance', async () => {
  const version = '5.11.0-beta.1';
  let reads = 0;
  const tags = [];
  await publishVerified({
    ...options,
    version,
    readVersion: async () => (++reads === 1 ? null : { ...record, version }),
    readTags: async () => ({ next: version }),
    publish: async (tag) => {
      tags.push(tag);
    },
  });
  assert.deepEqual(tags, ['next']);
  await assert.rejects(
    publishVerified({
      ...options,
      readVersion: async () => ({ ...record, 'dist.attestations': undefined }),
      publish: async () => assert.fail('must not publish'),
    }),
    /provenance/,
  );
});

test('post-publish integrity mismatch fails without consuming the retry window', async () => {
  let reads = 0;
  let publishes = 0;
  await assert.rejects(
    publishVerified({
      ...options,
      readVersion: async () =>
        ++reads === 1 ? null : { ...record, 'dist.integrity': 'sha512-other' },
      publish: async () => {
        publishes += 1;
      },
    }),
    /differs/,
  );
  assert.equal(reads, 2);
  assert.equal(publishes, 1);
});
