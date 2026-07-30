# Releasing the Node.js SDK

The public npm package is `@limeint/trade-api`. Releases are built and
published by `.github/workflows/publish_node.yml`.

## One-time setup

The workflow authenticates to npm with one GitHub Actions secret:
`NPM_TOKEN`.

1. On npmjs.com, open **Access Tokens** and create a granular token.
2. Enable **Bypass two-factor authentication** so GitHub Actions can publish
   non-interactively.
3. Under **Packages and scopes**, grant **Read and write** access to the
   `@limeint` scope. Organization permission alone does not grant package
   publishing permission.
4. Give the token a clear name such as `tradingapi-github-publish` and choose
   an appropriate expiration date.
5. In the GitHub repository, open **Settings → Secrets and variables →
   Actions**, create a repository secret named `NPM_TOKEN`, and paste the
   token.

The npm user that creates the token must be allowed to publish packages under
`@limeint`. Rotate the token before it expires by replacing the same GitHub
secret. Never put the token in `.npmrc`, source code, workflow YAML, issues, or
logs.

## Create a release

1. Update the version in both `package.json` and `package-lock.json`:

   ```sh
   cd sdk/node
   npm version 0.1.1 --no-git-tag-version
   ```

2. Regenerate and verify the package:

   ```sh
   npm ci
   npm run generate
   npm run typecheck
   npm test
   npm run build
   npm pack --dry-run
   ```

3. Commit the version bump and generated changes.
4. Create and push a tag whose version matches `package.json`:

   ```sh
   git tag node-v0.1.1
   git push origin node-v0.1.1
   ```

5. Create a GitHub Release from that tag. Publishing the release starts the
   npm workflow.

Stable versions publish under the npm `latest` tag. SemVer prereleases such as
`node-v0.2.0-beta.1` publish under `next`.

The workflow can also be started manually with an existing `node-vX.Y.Z` tag.
The selected tag must point to the commit containing the matching package
version.

## What the workflow verifies

Before the protected publish job runs, CI:

- checks the release tag against `package.json` and `package-lock.json`;
- regenerates protobuf code and rejects drift;
- type-checks the SDK, tests, and examples;
- runs the in-process gRPC integration suite;
- builds and packs the package;
- installs the tarball in an empty consumer project and imports its public
  entry points.

The exact tarball that passes these checks is uploaded and published.
