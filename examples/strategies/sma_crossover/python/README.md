# Limeint SMA 9/30 crossover — Python

Python implementation of the [SMA 9/30 crossover strategy](../README.md), built
on the published Limeint SDK (`limeint-sdk==2.18.1rc1`, imported as
`trade_api`).

Read [`../README.md`](../README.md) first for the rule, candle handling, and
safety guards. This page covers only how to install, run, and test the Python
version.

This directory is self-contained — copy it out of the repository and it still
runs.

## SDK boundary

For Trade API functionality, the strategy imports only the SDK's public
modules:

- `trade_api`
- `trade_api.accounts`
- `trade_api.market_data`
- `trade_api.orders`

It does not import from `sdk/python`, generated modules under
`trade_api.proto`, or the repository's raw `proto/` directory. The dependency
lockfile pins the published TestPyPI wheel and its SHA-256 digest. Consumer CI
verifies that `trade_api` resolves from the installed distribution rather than
this repository's source tree.

## Read the implementation in this order

1. [`strategy.py`](strategy.py) — the small, pure SMA calculation and crossover rule.
2. [`config.py`](config.py) — typed command-line and environment configuration.
3. [`runner.py`](runner.py) — market data, completed bars, and guarded orders.
4. [`main.py`](main.py) — the small executable entry point.
5. [`tests/test_sma_crossover.py`](tests/test_sma_crossover.py) — executable behavior examples.

The calculation is deliberately independent of the SDK. It can be tested or
reused without credentials, networking, or protobuf messages.

## Install

Python 3.10 or newer is required — the published SDK wheel carries protobuf 7
gencode, and protobuf 7 dropped Python 3.9.

```sh
cd examples/strategies/sma_crossover/python
uv sync --locked
```

## Run

Dry-run is the default: the example reads real market data and prints signals,
but never reads an account or places an order.

```sh
TRADE_API_SECRET=... \
python main.py \
  --symbol AAPL@XNAS \
  --timeframe M5 \
  --quantity 1
```

Environment variables work in place of flags — see the table in
[`../README.md`](../README.md#configuration). Python does not load
[`../.env.example`](../.env.example) automatically; it is a reference.

For the bounded read-only smoke test against the live API:

```sh
TRADE_API_SECRET=... python main.py --symbol AAPL@XNAS --check
```

To place real market orders, pass an account ID and `--execute`:

```sh
TRADE_API_SECRET=... \
TRADE_API_ACCOUNT_ID=... \
python main.py --symbol AAPL@XNAS --quantity 1 --execute
```

Full flag reference: `python main.py --help`.

The example stays flat and separates pure calculation, configuration,
orchestration, and startup so each file can be read independently.

## Test

No secret or network access is required:

```sh
uv run ruff check .
uv run ruff format --check .
uv run mypy .
uv run pytest
```
