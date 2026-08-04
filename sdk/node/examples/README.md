# Node.js SDK examples

Start with authentication and account discovery. It is bounded and does not
place an order.

From the repository root:

```sh
cd sdk/node
npm ci
TRADE_API_SECRET=... npm run example:auth
```

The script prints the account IDs visible to the secret and the single account
when exactly one is available. For a smaller clean-project example using the
published package, see the [SDK quick start](../README.md#quick-start).

## Stream quotes

This read-only example streams until Ctrl-C:

```sh
TRADE_API_SECRET=... \
TRADE_API_SYMBOL=AAPL@XNAS \
npm run example:quotes
```

## Place a real limit order

> **Warning:** This submits a real order, which can fill immediately. This
> example does not cancel it. Use a dedicated account and review every value.

The example requires two deliberate settings beyond the secret:

```sh
TRADE_API_SECRET=... \
TRADE_API_SYMBOL=AAPL@XNAS \
TRADE_API_QUANTITY=1 \
TRADE_API_LIMIT_PRICE=REPLACE_WITH_LIMIT_PRICE \
TRADE_API_EXECUTE=1 \
npm run example:order
```

Replace `REPLACE_WITH_LIMIT_PRICE` with your intended price. The example has no
default because no hardcoded price can be assumed safe.
