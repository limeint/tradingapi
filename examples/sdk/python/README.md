# Python SDK examples

These are standalone application examples for the published `limeint-sdk`
`2.18.1rc1` package. They do not import SDK source or generated protobuf files
from this repository.

## Install and authenticate

Python 3.10 or newer and `uv` are required. From the repository root:

```sh
cd examples/sdk/python
uv sync --locked
TRADE_API_SECRET=... uv run python auth_and_account.py
```

The bounded smoke test authenticates, prints the visible account IDs, and
fetches the first account when one is available. It never places an order.

## Stream quotes with asyncio

This read-only example streams until Ctrl-C:

```sh
TRADE_API_SECRET=... \
uv run python subscribe_quotes_async.py AAPL@XNAS MSFT@XNAS
```

## Place and attempt to cancel a real limit order

> **Warning:** This submits a real order, which can fill before cancellation.
> Use a dedicated account and review the symbol, quantity, and price.

```sh
TRADE_API_SECRET=... \
TRADE_API_SYMBOL=AAPL@XNAS \
TRADE_API_QUANTITY=1 \
TRADE_API_LIMIT_PRICE=REPLACE_WITH_LIMIT_PRICE \
TRADE_API_EXECUTE=1 \
uv run python place_limit_order.py
```

The order example intentionally has no default limit price.

## Contributors: use the local SDK

The committed dependency and lockfile always point to the published wheel.
From the repository root, opt into an editable SDK from the current checkout:

```sh
just examples-use-local-python
just examples-status
```

While the editable override is active, use `uv run --no-sync`; a regular
`uv run` synchronizes the environment back to the published lockfile. The root
smoke command handles this automatically:

```sh
just smoke-python-examples
```

Restore the published wheel deterministically with:

```sh
just examples-use-published-python
```
