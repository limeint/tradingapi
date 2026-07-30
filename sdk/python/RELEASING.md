# Releasing the SDKs

The Python and Node.js packages share one version and GitHub Release. This
document covers PyPI-specific setup; the combined release checklist is in
[the SDK release guide](../node/RELEASING.md).

## One-time setup

The publish workflow uses [PyPI trusted publishing](https://docs.pypi.org/trusted-publishers/)
via OIDC — no API tokens are stored in the repo. This must be configured
once per index (PyPI and TestPyPI), per project.

### 1. Create the PyPI projects

Create the `limeint-sdk` project on each index by doing a manual first upload
(with an account-scoped API token), **or** configure a "pending publisher"
before any release exists.

The pending-publisher route is preferred — it lets the GitHub Action create
the project on first publish, without ever using an API token:

- PyPI: <https://pypi.org/manage/account/publishing/> → *Add a pending publisher*
- TestPyPI: <https://test.pypi.org/manage/account/publishing/> → *Add a pending publisher*

Use these values for both indexes:

| Field | Value |
| --- | --- |
| PyPI project name | `limeint-sdk` |
| Owner | `limeint` |
| Repository name | `tradingapi` |
| Workflow filename | `publish_python.yml` |
| Environment | `pypi` (real) / `testpypi` (test) |

### 2. Configure the GitHub environments

In the GitHub repo, go to **Settings → Environments** and create two
environments: `pypi` and `testpypi`.

For `pypi`, strongly recommended:

- **Required reviewers** — at least one maintainer must approve each
  publish run. This is the safety net against accidental releases (PyPI
  versions are immutable).
- **Deployment branches** — restrict to tag pushes only.

For `testpypi`, no required reviewers — prereleases should publish
without ceremony.

## Cutting a release

### Pre-release / dry-run (publishes to TestPyPI)

1. Bump both SDKs to the same prerelease version by following
   [the shared checklist](../node/RELEASING.md), for example
   `2.19.0-rc.1`.
2. Update [CHANGELOG.md](CHANGELOG.md): move items from `[Unreleased]` to a
   new `[2.19.0-rc.1] — YYYY-MM-DD` section. Update the link references at
   the bottom.
3. Commit, push, merge to `main`.
4. Create a GitHub Release with a matching bare version tag,
   target `main`. Mark it *Pre-release*.
5. The `publish_python.yml` workflow detects the prerelease marker in the
   tag and pushes to TestPyPI.
6. Verify in a clean venv:
   ```sh
   python -m venv /tmp/limeint-verify && source /tmp/limeint-verify/bin/activate
   pip install -i https://test.pypi.org/simple/ \
     --extra-index-url https://pypi.org/simple/ \
     limeint-sdk==2.19.0rc1
   python -c "from trade_api import TradeAPIClient; print('ok')"
   ```
   The `--extra-index-url` is needed because TestPyPI doesn't mirror
   runtime dependencies (grpcio, protobuf, …).

### Final release (publishes to real PyPI)

1. Bump both SDKs to the same final version by following
   [the shared checklist](../node/RELEASING.md).
2. Update [CHANGELOG.md](CHANGELOG.md) similarly — final section, link
   references.
3. Commit, push, merge to `main`.
4. Create a GitHub Release with the matching bare version tag,
   target `main`. **Do not** mark it pre-release.
5. The workflow detects a final tag, requires environment approval (per
   the `pypi` environment config), and on approval pushes to PyPI.
6. Verify:
   ```sh
   python -m venv /tmp/limeint-verify && source /tmp/limeint-verify/bin/activate
   pip install limeint-sdk==2.18.1
   python -c "from trade_api import TradeAPIClient; print('ok')"
   ```

## Version policy

Both packages follow the Trade API release line and
[Semantic Versioning](https://semver.org/):

- **Major (X.0.0)** — breaking public API or protocol changes.
- **Minor (X.Y.0)** — backward-compatible RPCs or SDK features.
- **Patch (X.Y.Z)** — fixes, refactors, and synchronized package releases.

## Troubleshooting

### "Tag does not match pyproject.toml version"

The `build` job validates that the release tag (`2.18.1`) and both package
versions agree. If you tagged before bumping
the version: delete the release + tag, bump the version, push, and
recreate the release.

### Trusted publisher rejected the upload

Check that the GitHub environment name matches the one configured on PyPI
exactly (case-sensitive: `pypi`, `testpypi`). Then check the workflow
filename — PyPI expects `publish_python.yml` literally.

### `twine check` fails in CI

Run locally to see the exact issue:

```sh
cd sdk/python
uv sync --locked
uv run python -m build
uv run twine check --strict dist/*
```

Most common: README contains a markdown construct PyPI can't render
(rare with GitHub-flavored markdown), or a classifier was removed/renamed.

## What ships in the wheel

The build pipeline (see [.github/workflows/python_test.yml](../../.github/workflows/python_test.yml))
regenerates protobuf code from the root `proto/` directory and verifies that
both the wheel and source distribution contain:

- `trade_api/` — hand-written modules + per-service shim re-exports.
- `trade_api/proto/` — generated gRPC stubs (`.py` + `.pyi`).
- `trade_api/py.typed` — typing marker.
- `LICENSE`.

Notably *not* shipped: `tests/`, `examples/`, `scripts/`, `.venv/`,
`__pycache__/`.
