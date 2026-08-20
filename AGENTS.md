# Repository guidance

## Purpose and audience

This repository publishes the Limeint Python and Node.js Trade API SDKs and
contains complete strategy examples. Documentation should prioritize an SDK or
strategy user getting a safe first result. Contributor and release instructions
belong after user onboarding.

## Repository map

- `proto/` contains the source protobuf contracts and is managed externally.
- `sdk/python/` contains the `limeint-sdk` package, imported as `trade_api`.
- `sdk/node/` contains the `@limeint/trade-api` package.
- `examples/sdk/` contains focused, self-contained applications that depend on
  the published SDKs by default.
- `examples/strategies/` contains complete applications that depend on the
  published SDKs by default.
- `justfile` is the repository-wide contributor command surface.

Read the closest README before changing a package or example. Keep language-
specific instructions with that language and shared strategy behavior in the
strategy-level README.

## Safety

- Never commit, print, or invent a real `TRADE_API_SECRET`.
- Never run an example with `--execute` or invoke an order-placement example
  unless the user explicitly asks for a live order and confirms its parameters.
- Prefer credential-free tests. For onboarding, prefer the bounded strategy
  `--check` mode before dry-run streaming; it does not inspect accounts or place
  orders.
- Keep `.env.example` values fake. Real `.env` files are gitignored.

## Generated code and public boundaries

- `proto/` is managed externally and is not editable from this repository. Do
  not add, remove, reformat, or otherwise modify anything under `proto/`,
  including comments and the doc examples inside them. A needed contract change
  belongs upstream; surface it there and wait for the synced contracts.
- Do not hand-edit generated bindings under `sdk/node/src/generated/` or
  `sdk/python/trade_api/proto/`. They inherit upstream comments verbatim, so
  they can legitimately disagree with this repository's own documentation.
- Run `just generate` after `proto/` is re-synced from upstream.
- Handwritten SDK code must expose generated functionality through the existing
  public client and per-service module patterns.
- Example implementations must remain copyable and import only the public
  package for their language. Their committed manifests and lockfiles must
  resolve published artifacts; contributor commands may override installed
  environments locally without editing those files.
- Python and Node.js package versions move together. Python uses the normalized
  PEP 440 spelling such as `2.18.1rc1`; Node.js uses `2.18.1-rc.1`.

## Documentation expectations

- Commands presented as quick starts must work from a clean clone or clean
  consumer directory.
- Use `uv run python ...` after `uv sync` unless the instructions explicitly
  activate `.venv`.
- Label prerelease registry instructions and pin the exact prerelease version.
- Lead with authentication or read-only market data. Put real order examples
  behind an explicit warning.
- Show where to run a command from, required tools, expected first output, and
  the next relevant README.
- Use `AAPL@XNGS` in symbol examples. The Trade API resolves `ticker@mic`
  against segment MICs, so the Nasdaq operating MIC `XNAS` does not match a
  listing. `proto/` and the generated bindings still show `AAPL@XNAS`; that
  is upstream text and stays as it is.
- Avoid copying long API catalogs into agent instructions; link to the package
  README or source of truth instead.

## Verification

Run the narrowest relevant checks while working, then `just check` for changes
that cross package boundaries.

```sh
# Node.js SDK
npm --prefix sdk/node run check

# Node.js focused examples
npm --prefix examples/sdk/node run check

# Node.js strategies
npm --prefix examples/strategies/sma_crossover/node run check
npm --prefix examples/strategies/macd_zero_cross/node run check
npm --prefix examples/strategies/rsi_threshold/node run check

# Python SDK (generate bindings first when starting from a clean clone)
(cd sdk/python && uv run ./scripts/generate_proto.sh)
(cd sdk/python && uv run ruff check trade_api tests)
(cd sdk/python && uv run ruff format --check trade_api tests)
(cd sdk/python && uv run mypy trade_api)
(cd sdk/python && uv run pytest)

# Python focused examples
(cd examples/sdk/python && uv run ruff check .)
(cd examples/sdk/python && uv run ruff format --check .)
(cd examples/sdk/python && uv run mypy .)

# Python strategies; STRATEGY is sma_crossover, macd_zero_cross, or
# rsi_threshold
STRATEGY=sma_crossover
(cd examples/strategies/$STRATEGY/python && uv run ruff check .)
(cd examples/strategies/$STRATEGY/python && uv run ruff format --check .)
(cd examples/strategies/$STRATEGY/python && uv run mypy .)
(cd examples/strategies/$STRATEGY/python && uv run pytest)
```

Do not use `npm run format`, `ruff --fix`, or another modifying formatter during
a read-only review.
