# Release process

Pushing a `vX.Y.Z` tag starts [Release](.github/workflows/release.yml).
The workflow validates the tag, repository metadata, and packed files, then runs
JavaScript, Android, and iOS checks on the same commit. After approval of the
`release` environment, it publishes the saved tarball through npm trusted
publishing with provenance. Stable releases use `latest`; prereleases use `next`.

## One-time setup

In npm package Settings → Trusted Publisher, configure GitHub Actions:

| Field             | Value                            |
| ----------------- | -------------------------------- |
| Organization      | `appandflow`                     |
| Repository        | `react-native-safe-area-context` |
| Workflow filename | `release.yml`                    |
| Environment       | `release`                        |
| Allowed action    | Direct `npm publish`             |

Save and verify the connection. Create GitHub's `release` environment with a
maintainer reviewer and deployment **tag** rule `v*`. No npm write token is
needed. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

Keep the canonical lowercase repository URL in `package.json`; npm provenance
checks it against the GitHub repository identity.

## Release

1. Check npm's current versions and prepare the version bump in a separate PR.
2. Merge it after review and successful CI. Local npm publishing remains disabled
   in `release-it`.
3. Tag the merged commit, using the actual version in place of `X.Y.Z`:

   ```sh
   git switch main
   git pull --ff-only
   node scripts/check-release.mjs vX.Y.Z
   git tag -a vX.Y.Z -m 'Release X.Y.Z'
   git push origin vX.Y.Z
   ```

4. Approve the `release` environment after checks pass. Confirm npm publication:

   ```sh
   npm view react-native-safe-area-context@X.Y.Z version dist.integrity dist.attestations --json
   npm view react-native-safe-area-context dist-tags --json
   ```

5. Create the GitHub release:

   ```sh
   gh release create vX.Y.Z --verify-tag --generate-notes --title 'Release X.Y.Z'
   ```

Normal PR CI tests the release safeguards and inspects the package. Merging a PR
alone does not publish. Existing Android release-APK generation remains separate
and runs when the GitHub release is published.

## Recovery

- Use `gh run rerun RUN_ID --failed` to retry a failed publish with the saved
  artifact, retained for seven days. Matching published versions are skipped;
  integrity mismatches fail. Retrying never moves a newer dist-tag backward.
- npm processing can take several minutes. Verification polls for up to ten
  minutes after acceptance. If it times out, check the exact registry version
  before retrying; do not blindly republish or bump the version.
- If the artifact expired, rerun all jobs. Reruns use the original workflow
  revision. Never move an already-published tag.
- For authentication failures, check the saved npm owner, repository, workflow,
  environment, and direct-publish permission. For provenance failures, check the
  repository URL casing in the tarball.
