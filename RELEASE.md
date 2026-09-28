# Release process

This repository publishes `react-native-safe-area-context` to npm through
[Release](.github/workflows/release.yml). The example and docs are not published.
Existing Android release-APK generation remains a separate GitHub release job.

## One-time setup

In npm package Settings → Trusted Publisher, configure GitHub Actions:

| Field             | Value                            |
| ----------------- | -------------------------------- |
| Organization      | `appandflow`                     |
| Repository        | `react-native-safe-area-context` |
| Workflow filename | `release.yml`                    |
| Environment       | `release`                        |
| Allowed action    | Direct `npm publish`             |

Save and verify the connection; npm may require security-key authentication.
The publisher is the workflow identity, not a human maintainer. No npm write
token is needed. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

Create GitHub's `release` environment with an appropriate maintainer reviewer
and deployment **tag** rule `v*`. Confirm the saved configuration before a
release. Workflow YAML alone does not create these protection rules.

`package.json` uses `git+https://github.com/appandflow/react-native-safe-area-context.git`.
Keep this exact casing: npm provenance compares it with GitHub's repository
identity. The release preflight checks this before expensive native builds.

## Prepare a candidate

Start from current `main` and check npm before choosing the version:

```sh
git fetch origin --tags
npm view react-native-safe-area-context dist-tags --json --registry=https://registry.npmjs.org/
```

Stable versions publish to `latest`; prereleases publish to `next`. Follow the
repository's review requirements for both code and version changes. `main`
requires an approved PR; do not bypass that requirement to make a release.

Run the existing checks plus release safeguards:

```sh
yarn install --frozen-lockfile
yarn test
node --test scripts/*.test.mjs
yarn build
mkdir -p artifacts
npm pack --ignore-scripts --pack-destination artifacts
node scripts/check-package.mjs artifacts/react-native-safe-area-context-X.Y.Z.tgz
node scripts/check-release.mjs vX.Y.Z
```

The final two commands use the candidate's actual version. The package check
verifies CommonJS/ESM/declarations, native sources, codegen sources, Swift package
manifest, podspec, Jest mock, entrypoints, registry, and repository identity.
CI retains Android legacy/Fabric builds on Linux/Windows and both iOS builds.
Device behavior affected by the release still needs device validation.

After the workflow is merged, run Actions → Release → Run workflow with
`publish` **false** for a dry run. PR changes to the release infrastructure also
run package safeguards; the existing JavaScript/native workflows keep their PR
triggers, avoiding duplicate native builds in Release. These runs never enter the release
environment or publish. They cannot prove npm's OIDC trust relationship; the
next intentional release provides that verification.

## Release after review

Merge the reviewed version change before tagging. The existing `release-it`
configuration no longer publishes locally. If its direct push would bypass
branch review, prepare the version through a PR instead and create the tag on
that merged commit:

```sh
git switch main
git pull --ff-only
node scripts/check-release.mjs vX.Y.Z
git tag -a vX.Y.Z -m 'Release X.Y.Z'
git push origin vX.Y.Z
gh release create vX.Y.Z --verify-tag --generate-notes --title 'Release X.Y.Z'
```

A tag starts Release. Cheap metadata and tarball checks run first; all reusable
CI workflows then check the same resolved commit. Only after every check passes
can a reviewer approve the `release` environment. Publish downloads that exact
artifact and uses npm OIDC with provenance; it does not rebuild. Artifacts are
kept for seven days.

Confirm the exact version, integrity, provenance, and dist-tag:

```sh
npm view react-native-safe-area-context@X.Y.Z version dist.integrity dist.attestations --json --registry=https://registry.npmjs.org/
npm view react-native-safe-area-context dist-tags --json --registry=https://registry.npmjs.org/
```

## Retry and recovery

- If the package and workflow are correct and the artifact still exists, use
  `gh run rerun RUN_ID --failed`. This avoids repeating native CI. Approve the
  environment again when required. An existing matching version is verified
  and skipped; a different integrity fails. Retrying an old version never moves
  a newer dist-tag backward.
- To run manually, select the existing `vX.Y.Z` **tag as the workflow ref**, then
  set `publish` to true. CLI equivalent:
  `gh workflow run release.yml --ref vX.Y.Z -F publish=true`.
  A manual publish on a branch fails preflight before native builds. Checking
  out a tag inside a run on `main` would not satisfy the `v*` environment rule.
- An expired artifact requires a fresh run of the tag. A rerun uses its original
  workflow revision: merging a workflow fix does not update an old run. Never
  move an already-published tag. If an unpublished version must be preserved
  while correcting its source/workflow, obtain explicit maintainer agreement
  for the recovery rather than silently retagging or changing deployment rules.
- npm may accept a package but take several minutes to expose it. The workflow
  polls for ten minutes. If it reports publication accepted but verification
  pending, inspect the exact registry version first. Once it appears, rerun
  failed jobs to verify the matching artifact; do not blindly republish or bump.
- For OIDC permission errors, verify the saved npm owner/repo/workflow/environment
  and direct-publish permission. Do not introduce a long-lived npm token.
- For E422 provenance failures, check repository URL casing in the tarball.
  For a failed job with no logs/steps, inspect check annotations and environment
  rules before diagnosing npm.

Adding this workflow does not publish a version. Publication requires a pushed
release tag or an explicit manual publish on an existing release tag, successful
checks, and release-environment approval.
