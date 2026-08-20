# Limeint RSI 14 threshold — Python

Python implementation of the [RSI threshold strategy](../README.md), using the
published Limeint SDK (`limeint-sdk==2.19.1`, imported as `trade_api`).

## Quick start

Requires Python 3.10 or newer and [uv](https://docs.astral.sh/uv/). From the
repository root:

```sh
cd examples/strategies/rsi_threshold/python
uv sync --locked
TRADE_API_SECRET=... uv run python main.py --symbol AAPL@XNAS --check
```

Check mode authenticates, fetches historical bars, calculates the latest
confirmed RSI, prints one result, and exits. It does not read an account, open a
live subscription, or place an order.

```text
History check passed: close=... rsi=... average_gain=... average_loss=... signal=...
```

The `rsi` value is on a 0..1 scale, so `0.2` and `0.8` are the levels a chart
would label 20 and 80. See [Scale](../README.md#scale-02-and-08-not-20-and-80).

If authentication fails, confirm that the secret is active and has market-data
access. If no bars are returned, verify the `ticker@mic` symbol and its market.
The rule needs 16 candles to warm up, so a long timeframe may report too few
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

1. [`strategy.py`](strategy.py) — pure RSI calculation and threshold rule.
2. [`config.py`](config.py) — flags and environment configuration.
3. [`runner.py`](runner.py) — completed bars, position tracking, guarded orders.
4. [`main.py`](main.py) — executable entry point.
5. [`tests/test_rsi_threshold.py`](tests/test_rsi_threshold.py) — behavior
   examples.

The calculation is independent of the SDK and can be reused or tested without
credentials, networking, or protobuf messages. `evaluate` takes the period and
both levels as arguments, so the same module covers other RSI settings.

Because both rules are levels rather than crossings, `evaluate` needs the
caller's position state to avoid repeating a signal on every candle that stays
beyond its level. `runner.py` owns that flag; see
[How the position is tracked](../README.md#how-the-position-is-tracked) before
reusing `strategy.py` in your own loop.

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
