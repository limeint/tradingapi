# Releasing the SDKs

Python and Node.js share one version and one GitHub Release:

- `limeint-sdk` publishes to PyPI;
- `@limeint/trade-api` publishes to npm.

The release starts both `.github/workflows/publish_python.yml` and
`.github/workflows/publish_node.yml`.

## One-time npm setup

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

1. Choose one new version that has never been published to either registry.
   Update the Python version in `sdk/python/pyproject.toml`, then update both
   Node package files:

   ```sh
   cd sdk/node
   npm version 2.18.1 --no-git-tag-version
   ```

2. Regenerate and verify both SDKs:

   ```sh
   cd ../..
   just bootstrap
   just check

   npm --prefix sdk/node run build
   npm --prefix sdk/node pack --dry-run
   ```

3. Commit the version bump. Generated bindings are recreated during CI builds.
4. Create one GitHub Release targeting that commit with the bare version tag,
   for example `2.18.1`. Publishing it starts both registry workflows.

Stable versions publish to PyPI and under npm's `latest` tag. Prereleases
publish to TestPyPI and under npm's `next` tag.

The Node workflow can also be started manually with an existing version tag.
That tag must point to the commit containing the matching Python and Node
versions.

## What the workflow verifies

Before the protected publish job runs, CI:

- checks the release tag against the Python and Node package versions;
- regenerates protobuf code from the tagged source contracts;
- type-checks the SDK, tests, and examples;
- runs the in-process gRPC integration suite;
- builds and packs the package;
- installs the tarball in an empty consumer project and imports its public
  entry points.

The exact tarball that passes these checks is uploaded and published.
