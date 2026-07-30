# Limeint SMA 9/30 crossover — Node.js

TypeScript implementation of the [SMA 9/30 crossover strategy](../README.md).
It consumes the published `@limeint/trade-api@2.18.1-rc.1` package from npm;
there are no imports from this repository's SDK source or protobuf directory.

## Install and test

Node.js 20 or newer is required.

```sh
cd strategies/sma_crossover/node
npm ci
npm ls @limeint/trade-api
npm run format
npm run check
```

The SDK dependency is pinned exactly so this directory is also a reproducible
consumer test for the published release candidate.

## Run

Dry-run is the default:

```sh
TRADE_API_SECRET=... \
npm start -- --symbol SBER@MISX --timeframe M5 --quantity 1
```

Run the bounded, read-only history check:

```sh
TRADE_API_SECRET=... npm start -- --symbol SBER@MISX --check
```

Allow real market orders only with both an account ID and `--execute`:

```sh
TRADE_API_SECRET=... \
TRADE_API_ACCOUNT_ID=... \
npm start -- --symbol SBER@MISX --quantity 1 --execute
```

Use `npm start -- --help` for the short command reference. The environment
variables are shared with the Python implementation and documented in
[`../README.md`](../README.md#configuration).
