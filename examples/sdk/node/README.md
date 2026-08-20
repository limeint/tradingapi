# Node.js SDK examples

These are standalone application examples for the published
`@limeint/trade-api@2.19.1` package. They do not import SDK source or
protobuf files from this repository.

## Install and authenticate

Node.js 20 or newer is required. From the repository root:

```sh
cd examples/sdk/node
npm ci
TRADE_API_SECRET=... npm run smoke
```

The bounded smoke test authenticates, prints the visible account IDs, and
fetches the first account when one is available. It never places an order.

## Stream quotes

This read-only example streams until Ctrl-C:

```sh
TRADE_API_SECRET=... \
TRADE_API_SYMBOL=AAPL@XNGS \
npm run quotes
```

## Place a real limit order

> **Warning:** This submits a real order, which can fill immediately. It does
> not attempt to cancel the order. Use a dedicated account and review every
> value.

```sh
TRADE_API_SECRET=... \
TRADE_API_SYMBOL=AAPL@XNGS \
TRADE_API_QUANTITY=1 \
TRADE_API_LIMIT_PRICE=REPLACE_WITH_LIMIT_PRICE \
TRADE_API_EXECUTE=1 \
npm run order
```

The order example intentionally has no default limit price.

## Contributors: use the local SDK

The committed dependency and lockfile always point to the published package.
From the repository root, opt into the SDK from the current checkout with:

```sh
just examples-use-local-node
just examples-status
```

Local Node.js examples consume the SDK's built `dist` directory. For iterative
debugging, run `just watch-node-sdk` in a second terminal. Restore the published
package deterministically with:

```sh
just examples-use-published-node
```
