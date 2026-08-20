# Limeint Trade API

Use Limeint's Trade API from Python or Node.js, or start from a complete example
strategy. The SDKs handle gRPC transport, authentication, token renewal, retries,
and streaming so applications can focus on trading logic.

## Start here

| Goal | Recommended path |
| --- | --- |
| See the API work without placing an order | [Run the SMA strategy history check](#run-a-safe-strategy-check) |
| Build a Python application | [Python SDK quick start](sdk/python/README.md#quick-start) |
| Build a Node.js application | [Node.js SDK quick start](sdk/node/README.md#quick-start) |
| Understand a complete strategy | [SMA 9/30 crossover](examples/strategies/sma_crossover/) |
| See a second, asymmetric rule | [MACD 12/26/9 zero cross](examples/strategies/macd_zero_cross/) |
| See a mean-reversion rule | [RSI 14 threshold](examples/strategies/rsi_threshold/) |
| Work on this repository | [Repository development](#repository-development) |

The checkout currently targets the `2.19.1` release. The Node.js package
`@limeint/trade-api` is on npm, and the Python package `limeint-sdk` is on PyPI.

## Before you begin

You need a Trade API secret issued by Limeint. Ask your Limeint account
administrator or support contact if you do not have one. Treat it like a
password: keep it in your environment or a gitignored `.env` file, and never
paste it into source code, chat, issues, or logs. Contributors working in this
checkout can put it in one root `.env`; see
[One environment file for every example](#one-environment-file-for-every-example).

Examples use symbols in `ticker@mic` form, such as `AAPL@XNGS`. The account and
market-data permissions attached to your secret determine which operations and
symbols are available.

## Run a safe strategy check

The bounded `--check` mode authenticates, fetches historical candles, calculates
the latest SMA values, prints one result, and exits. It does not subscribe to a
live stream, inspect an account, or place an order.

### Python

Requires Python 3.10 or newer and [uv](https://docs.astral.sh/uv/).

```sh
cd examples/strategies/sma_crossover/python
uv sync --locked
TRADE_API_SECRET=... uv run python main.py --symbol AAPL@XNGS --check
```

### Node.js

Requires Node.js 20 or newer.

```sh
cd examples/strategies/sma_crossover/node
npm ci
TRADE_API_SECRET=... npm start -- --symbol AAPL@XNGS --check
```

Expected output starts with:

```text
History check passed: close=... sma9=... sma30=... signal=...
```

Continue with the [strategy guide](examples/strategies/sma_crossover/) to learn
how dry-run streaming, candle completion, signals, and guarded execution work.

## Use an SDK

- [Python SDK](sdk/python/README.md) — synchronous and asyncio clients, installed
  as `limeint-sdk` and imported as `trade_api`.
- [Node.js SDK](sdk/node/README.md) — Promise-based unary calls and
  `AsyncIterable` streams, installed as `@limeint/trade-api`.

Both quick starts begin with authentication and account discovery. Standalone
consumer examples live under [`examples/sdk/`](examples/sdk/); their manifests
and lockfiles install the published SDKs. Complete strategy applications live
under [`examples/strategies/`](examples/strategies/).

## Repository map

```text
proto/                  source protobuf contracts
sdk/python/             publishable Python SDK
sdk/node/               publishable Node.js SDK
examples/sdk/           focused examples using the published SDKs
examples/strategies/    complete applications using the published SDKs
```

The wire-level protobuf namespace is `grpc.tradeapi.v1`. Generated bindings are
build artifacts; edit the contracts under `proto/`, not generated files.

## Repository development

This section is for contributors rather than SDK consumers. Install Node.js 20+,
Python 3.10+, `uv`, `just`, and `zsh`, then run from the repository root:

```sh
just bootstrap
just check
```

`just bootstrap` installs locked dependencies, configures pre-commit, and
generates language bindings. `just check` runs formatting checks, linting, type
checking, and credential-free tests for both SDKs and all example projects. Use
`just format` to apply formatting changes and `just generate` after changing
files under `proto/`.

Examples use published SDKs after `just bootstrap`. To debug every example
against SDKs from the current checkout without editing a manifest or lockfile:

```sh
just examples-use-local
just examples-status
```

Use `just examples-use-published` to restore the locked packages. With
`TRADE_API_SECRET` available, `just smoke-examples-local` and
`just smoke-examples-published` run the bounded authentication and strategy
checks in the requested mode. Neither command places orders.

### One environment file for every example

Every `just` recipe loads a single gitignored `.env` from the repository root,
so the secret and the shared example settings are configured once:

```sh
cp .env.example .env
# Edit .env, then:
just env-status
just run-strategy-python sma_crossover --check
just run-strategy-node sma_crossover --check
just run-sdk-python auth_and_account.py
just run-sdk-node auth
```

`just env-status` prints the loaded settings and masks the secret. Variables
already exported in your shell take precedence over the file, so
`TRADE_API_SYMBOL=MSFT@XNGS just run-strategy-node sma_crossover --check` still
works. The example programs themselves never read `.env`; they read the process
environment, which keeps each directory runnable once copied out of this
repository.

## Releases

Python and Node.js packages share one version. A GitHub Release with a bare
version tag publishes both packages. Maintainers should follow the
[combined SDK release guide](sdk/node/RELEASING.md).

Repository and issue tracker: <https://github.com/limeint/tradingapi>.
