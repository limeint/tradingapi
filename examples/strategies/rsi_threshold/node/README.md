# Limeint RSI 14 threshold — Node.js

TypeScript implementation of the [RSI threshold strategy](../README.md), using
the published `@limeint/trade-api@2.19.1` package.

## Quick start

Requires Node.js 20 or newer. From the repository root:

```sh
cd examples/strategies/rsi_threshold/node
npm ci
TRADE_API_SECRET=... npm start -- --symbol AAPL@XNAS --check
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

1. [`strategy.ts`](strategy.ts) — pure RSI calculation and threshold rule.
2. [`config.ts`](config.ts) — flags and environment configuration.
3. [`runner.ts`](runner.ts) — completed bars, position tracking, guarded orders.
4. [`main.ts`](main.ts) — executable entry point.
5. [`tests/rsi-threshold.test.ts`](tests/rsi-threshold.test.ts) — behavior
   examples.

`evaluate` takes the period and both levels as arguments, so the same module
covers other RSI settings. The directory is self-contained and imports no SDK
source or protobuf files from this repository. Its exact package pin also makes
it a consumer test for the published release candidate.

Because both rules are levels rather than crossings, `evaluate` needs the
caller's position state to avoid repeating a signal on every candle that stays
beyond its level. `runner.ts` owns that flag; see
[How the position is tracked](../README.md#how-the-position-is-tracked) before
reusing `strategy.ts` in your own loop.

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
