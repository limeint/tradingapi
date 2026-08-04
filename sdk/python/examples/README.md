# Python SDK examples

Start with authentication and account discovery. It is bounded and does not
place an order.

From the repository root:

```sh
cd sdk/python
uv sync --locked
uv run ./scripts/generate_proto.sh
TRADE_API_SECRET=... uv run python examples/auth_and_account.py
```

The script prints the account returned when the secret exposes exactly one. For
a smaller clean-project example using the published package, see the
[SDK quick start](../README.md#quick-start).

## Stream quotes with asyncio

This read-only example streams until Ctrl-C:

```sh
TRADE_API_SECRET=... \
uv run python examples/subscribe_quotes_async.py AAPL@XNAS MSFT@XNAS
```

## Place and attempt to cancel a real limit order

> **Warning:** This submits a real order, which can fill before cancellation.
> Use a dedicated account and review the symbol, quantity, and price.

The example requires two deliberate settings beyond the secret:

```sh
TRADE_API_SECRET=... \
TRADE_API_SYMBOL=AAPL@XNAS \
TRADE_API_QUANTITY=1 \
TRADE_API_LIMIT_PRICE=REPLACE_WITH_LIMIT_PRICE \
TRADE_API_EXECUTE=1 \
uv run python examples/place_limit_order.py
```

Replace `REPLACE_WITH_LIMIT_PRICE` with your intended price. The example has no
default because no hardcoded price can be assumed safe.
