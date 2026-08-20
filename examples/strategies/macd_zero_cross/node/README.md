# Limeint MACD 12/26/9 zero cross — Node.js

TypeScript implementation of the [MACD zero-cross strategy](../README.md), using
the published `@limeint/trade-api@2.19.1` package.

## Quick start

Requires Node.js 20 or newer. From the repository root:

```sh
cd examples/strategies/macd_zero_cross/node
npm ci
TRADE_API_SECRET=... npm start -- --symbol AAPL@XNAS --check
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

## Run the live dry-run

Dry-run is the default. It reads real historical and streaming market data and
logs signals, but it never reads an account or places an order. Stop it with
Ctrl-C.

```sh
TRADE_API_SECRET=... \
npm start -- --symbol AAPL@XNAS --timeframe M5 --quantity 1
```

Flags can be replaced by the environment variables in the shared
[configuration table](../README.md#configuration). Neither Node.js nor this
example loads `.env` automatically. Use `npm start -- --help` for all flags.

## Enable real execution

> **Warning:** `--execute` can place real market orders. Use a dedicated account,
> understand the [safety limitations](../README.md#safety-guards), and verify
> check and dry-run modes first.

```sh
TRADE_API_SECRET=... \
npm start -- --symbol AAPL@XNAS --quantity 1 --execute
```

At startup, the strategy discovers account IDs through
`AuthService.TokenDetails` and refuses to execute unless the token exposes
exactly one account. It also starts flat, so it never sells a position it did
not open.

## Test locally

No secret or network access is required:

```sh
npm run check
```

This runs Biome, TypeScript, and the focused unit tests. Use `npm run format`
only when you intend to modify formatting.

## Read the implementation

1. [`strategy.ts`](strategy.ts) — pure MACD calculation and zero-cross rule.
2. [`config.ts`](config.ts) — flags and environment configuration.
3. [`runner.ts`](runner.ts) — completed bars, position tracking, guarded orders.
4. [`main.ts`](main.ts) — executable entry point.
5. [`tests/macd-zero-cross.test.ts`](tests/macd-zero-cross.test.ts) — behavior
   examples.

`evaluate` takes the window lengths as arguments, so the same module covers
other MACD settings. The directory is self-contained and imports no SDK source
or protobuf files from this repository. Its exact package pin also makes it a
consumer test for the published release candidate.

Repository contributors can temporarily link the SDK from this checkout
without changing `package.json` or `package-lock.json`. Run from the repository
root:

```sh
just examples-use-local-node
just examples-status
```

Use `just watch-node-sdk` in a second terminal to rebuild linked SDK code as it
changes. Restore the published dependency with
`just examples-use-published-node`.
