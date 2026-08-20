# Limeint MACD 12/26/9 zero cross — Python

Python implementation of the [MACD zero-cross strategy](../README.md), using the
published Limeint SDK (`limeint-sdk==2.19.1`, imported as `trade_api`).

## Quick start

Requires Python 3.10 or newer and [uv](https://docs.astral.sh/uv/). From the
repository root:

```sh
cd examples/strategies/macd_zero_cross/python
uv sync --locked
TRADE_API_SECRET=... uv run python main.py --symbol AAPL@XNAS --check
```

Check mode authenticates, fetches historical bars, calculates the latest
confirmed MACD values, prints one result, and exits. It does not read an account,
open a live subscription, or place an order.

```text
History check passed: close=... macd=... macd_signal=... histogram=... signal=...
```

If authentication fails, confirm that the secret is active and has market-data
access. If no bars are returned, verify the `ticker@mic` symbol and its market.
The rule needs 35 candles to warm up, so a long timeframe may report too few
bars; `--timeframe M5` is the default and returns plenty.

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
exactly one account. It also starts flat, so it never sells a position it did
not open.

## Test locally

No secret or network access is required:

```sh
uv run ruff check .
uv run ruff format --check .
uv run mypy .
uv run pytest
```

## Read the implementation

1. [`strategy.py`](strategy.py) — pure MACD calculation and zero-cross rule.
2. [`config.py`](config.py) — flags and environment configuration.
3. [`runner.py`](runner.py) — completed bars, position tracking, guarded orders.
4. [`main.py`](main.py) — executable entry point.
5. [`tests/test_macd_zero_cross.py`](tests/test_macd_zero_cross.py) — behavior
   examples.

The calculation is independent of the SDK and can be reused or tested without
credentials, networking, or protobuf messages. `evaluate` takes the window
lengths as arguments, so the same module covers other MACD settings.

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
