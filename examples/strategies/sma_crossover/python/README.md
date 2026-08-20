# Limeint SMA 9/30 crossover — Python

Python implementation of the [SMA 9/30 crossover strategy](../README.md), using
the published Limeint SDK (`limeint-sdk==2.19.1`, imported as `trade_api`).

## Quick start

Requires Python 3.10 or newer and [uv](https://docs.astral.sh/uv/). From the
repository root:

```sh
cd examples/strategies/sma_crossover/python
uv sync --locked
TRADE_API_SECRET=... uv run python main.py --symbol AAPL@XNAS --check
```

Check mode authenticates, fetches historical bars, calculates the latest
confirmed SMA values, prints one result, and exits. It does not read an account,
open a live subscription, or place an order.

```text
History check passed: close=... sma9=... sma30=... signal=...
```

If authentication fails, confirm that the secret is active and has market-data
access. If no bars are returned, verify the `ticker@mic` symbol and its market.

`uv sync` creates a local virtual environment but does not activate it. Keep the
`uv run` prefix on the commands below unless you activate `.venv` yourself.

## Run the live dry-run

Dry-run is the default. It reads real historical and streaming market data and
logs signals, but it never reads an account or places an order. Stop it with
Ctrl-C.

```sh
TRADE_API_SECRET=... \
uv run python main.py \
  --symbol AAPL@XNAS \
  --timeframe M5 \
  --quantity 1
```

Flags can be replaced by the environment variables in the shared
[configuration table](../README.md#configuration). Python does not load
[`../.env.example`](../.env.example) automatically. Use
`uv run python main.py --help` for all flags.

## Enable real execution

> **Warning:** `--execute` can place real market orders. Use a dedicated account,
> understand the [safety limitations](../README.md#safety-guards), and verify
> check and dry-run modes first.

```sh
TRADE_API_SECRET=... \
uv run python main.py --symbol AAPL@XNAS --quantity 1 --execute
```

At startup, the strategy discovers account IDs through
`AuthService.TokenDetails` and refuses to execute unless the token exposes
exactly one account.

## Test locally

No secret or network access is required:

```sh
uv run ruff check .
uv run ruff format --check .
uv run mypy .
uv run pytest
```

## Read the implementation

1. [`strategy.py`](strategy.py) — pure SMA calculation and crossover rule.
2. [`config.py`](config.py) — flags and environment configuration.
3. [`runner.py`](runner.py) — completed bars and guarded orders.
4. [`main.py`](main.py) — executable entry point.
5. [`tests/test_sma_crossover.py`](tests/test_sma_crossover.py) — behavior examples.

The calculation is independent of the SDK and can be reused or tested without
credentials, networking, or protobuf messages.

Repository contributors can temporarily install the SDK from this checkout in
editable mode without changing `pyproject.toml` or `uv.lock`. Run from the
repository root:

```sh
just examples-use-local-python
just examples-status
```

While the override is active, use the root smoke command or `uv run --no-sync`.
Restore the published wheel with `just examples-use-published-python`.

## Published SDK boundary

This directory is self-contained and can be copied out of the repository. For
Trade API functionality it imports only public `trade_api` modules. It does not
import from `sdk/python`, generated modules under `trade_api.proto`, or the raw
repository `proto/` directory. The lockfile pins the PyPI wheel and its
SHA-256 digest, and consumer CI verifies that imports resolve from that installed
distribution.
