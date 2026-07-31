# Limeint Trade API — Python SDK

Limeint's Python SDK for the gRPC Trade API. It wraps the generated stubs with:

- a single `TradeAPIClient` / `AsyncTradeAPIClient` entry point,
- automatic JWT issuance and background refresh (via `AuthService.SubscribeJwtRenewal`),
- typed exceptions mapped from gRPC status codes,
- exponential-backoff retries on transient failures (`UNAVAILABLE`, `RESOURCE_EXHAUSTED`).

Service methods are invoked directly on the generated stubs, so the full proto
surface is available without an extra translation layer.

## Installation

Python 3.10 or newer is required.

```sh
pip install limeint-sdk
```

> The PyPI distribution is `limeint-sdk`; the Python import name is `trade_api`.

## Quickstart (sync)

```python
from trade_api import TradeAPIClient
from trade_api.accounts import GetAccountRequest
from trade_api.market_data import SubscribeQuoteRequest

with TradeAPIClient(secret="YOUR_API_TOKEN") as client:
    account = client.accounts.GetAccount(GetAccountRequest(account_id="A12345"))
    print(account)

    # Streaming RPCs return iterators.
    for tick in client.market_data.SubscribeQuote(
        SubscribeQuoteRequest(symbols=["SBER@MISX"])
    ):
        print(tick)
```

## Quickstart (asyncio)

```python
import asyncio

from trade_api import AsyncTradeAPIClient
from trade_api.market_data import SubscribeQuoteRequest


async def main() -> None:
    async with AsyncTradeAPIClient(secret="YOUR_API_TOKEN") as client:
        async for tick in client.market_data.SubscribeQuote(
            SubscribeQuoteRequest(symbols=["SBER@MISX"])
        ):
            print(tick)


asyncio.run(main())
```

## Available services

The client exposes the full Trade API surface via sub-clients:

| Attribute            | gRPC service          | What it does                                  |
| -------------------- | --------------------- | --------------------------------------------- |
| `client.auth`        | `AuthService`         | Token issuance + details (usually automatic). |
| `client.accounts`    | `AccountsService`     | Accounts, positions, trades, transactions.    |
| `client.assets`      | `AssetsService`       | Instruments, exchanges, schedules, options.   |
| `client.market_data` | `MarketDataService`   | Bars, quotes, order book, trade streams.      |
| `client.orders`      | `OrdersService`       | Place / cancel orders, order + trade streams. |
| `client.reports`     | `ReportsService`      | Account reports.                              |
| `client.metrics`     | `UsageMetricsService` | API usage / quota metrics.                    |

## API reference

Every RPC defined in the `.proto` files is exposed directly on the sub-client.
Request and response message types are re-exported from short, per-service
modules:

| Module                    | Use with                                                    |
| ------------------------- | ----------------------------------------------------------- |
| `trade_api.accounts`      | `client.accounts.*`                                         |
| `trade_api.assets`        | `client.assets.*`                                           |
| `trade_api.market_data`   | `client.market_data.*`                                      |
| `trade_api.orders`        | `client.orders.*` (includes `Side`)                         |
| `trade_api.reports`       | `client.reports.*`                                          |
| `trade_api.metrics`       | `client.metrics.*`                                          |
| `trade_api.auth_messages` | `client.auth.*` (rarely needed — JWT handled automatically) |

The original deeply-nested paths
(`trade_api.proto.grpc.tradeapi.v1.<service>.<service>_service_pb2`)
still work and remain the source of truth.

Legend: ▶ unary · ⇉ server-stream · ⇄ bidi-stream

### `client.auth` — `AuthService`

| Method                                            | Kind | Purpose                                                               |
| ------------------------------------------------- | :--: | --------------------------------------------------------------------- |
| `Auth(AuthRequest)`                               |  ▶   | Exchange API secret for a JWT. _Called for you on construction._      |
| `TokenDetails(TokenDetailsRequest)`               |  ▶   | Inspect a JWT — expiry, market-data permissions, visible account IDs. |
| `SubscribeJwtRenewal(SubscribeJwtRenewalRequest)` |  ⇉   | Stream of refreshed JWTs. _Consumed for you in the background._       |

### `client.accounts` — `AccountsService`

| Method                                | Kind | Purpose                                          |
| ------------------------------------- | :--: | ------------------------------------------------ |
| `GetAccount(GetAccountRequest)`       |  ▶   | Account info: equity, cash, positions, margin.   |
| `Trades(TradesRequest)`               |  ▶   | Historical trades for an account.                |
| `Transactions(TransactionsRequest)`   |  ▶   | Cash movements and other non-trade transactions. |
| `SubscribeAccount(GetAccountRequest)` |  ⇉   | Streaming account updates.                       |

### `client.assets` — `AssetsService`

| Method                                    | Kind | Purpose                                         |
| ----------------------------------------- | :--: | ----------------------------------------------- |
| `Exchanges(ExchangesRequest)`             |  ▶   | List of supported exchanges.                    |
| `Assets(AssetsRequest)`                   |  ▶   | Tradable instruments (filtered).                |
| `AllAssets(AllAssetsRequest)`             |  ▶   | Full instrument catalog.                        |
| `GetAsset(GetAssetRequest)`               |  ▶   | Single instrument by symbol.                    |
| `GetAssetParams(GetAssetParamsRequest)`   |  ▶   | Trading parameters for an instrument.           |
| `OptionsChain(OptionsChainRequest)`       |  ▶   | Options chain for an underlying.                |
| `Schedule(ScheduleRequest)`               |  ▶   | Trading session schedule.                       |
| `Clock(ClockRequest)`                     |  ▶   | Server clock (use for time-aligned operations). |
| `GetConstituents(GetConstituentsRequest)` |  ▶   | Index constituents.                             |

### `client.market_data` — `MarketDataService`

| Method                                                | Kind | Purpose                                            |
| ----------------------------------------------------- | :--: | -------------------------------------------------- |
| `Bars(BarsRequest)`                                   |  ▶   | OHLC candles (any timeframe via `TimeFrame` enum). |
| `LastQuote(QuoteRequest)`                             |  ▶   | Most recent quote snapshot.                        |
| `OrderBook(OrderBookRequest)`                         |  ▶   | Order book snapshot.                               |
| `LatestTrades(LatestTradesRequest)`                   |  ▶   | Most recent trades for a symbol.                   |
| `SubscribeQuote(SubscribeQuoteRequest)`               |  ⇉   | Live quote stream.                                 |
| `SubscribeOrderBook(SubscribeOrderBookRequest)`       |  ⇉   | Live order-book updates.                           |
| `SubscribeLatestTrades(SubscribeLatestTradesRequest)` |  ⇉   | Live trades stream.                                |
| `SubscribeBars(SubscribeBarsRequest)`                 |  ⇉   | Live candle stream.                                |

### `client.orders` — `OrdersService`

| Method                                          | Kind | Purpose                                                     |
| ----------------------------------------------- | :--: | ----------------------------------------------------------- |
| `PlaceOrder(Order)`                             |  ▶   | Place market / limit / stop / stop-limit / multi-leg order. |
| `PlaceSLTPOrder(SLTPOrder)`                     |  ▶   | Place an SL/TP (stop-loss + take-profit) order.             |
| `CancelOrder(CancelOrderRequest)`               |  ▶   | Cancel an active order.                                     |
| `GetOrders(OrdersRequest)`                      |  ▶   | List active orders for an account.                          |
| `GetOrder(GetOrderRequest)`                     |  ▶   | Single order by ID.                                         |
| `SubscribeOrders(SubscribeOrdersRequest)`       |  ⇉   | Live order-state updates.                                   |
| `SubscribeTrades(SubscribeTradesRequest)`       |  ⇉   | Live execution / fill stream.                               |
| `SubscribeOrderTrade(stream OrderTradeRequest)` |  ⇄   | Bidi stream — order + trade events, request-driven.         |

### `client.reports` — `ReportsService`

| Method                                                          | Kind | Purpose                                                    |
| --------------------------------------------------------------- | :--: | ---------------------------------------------------------- |
| `CreateAccountReport(CreateAccountReportRequest)`               |  ▶   | Generate an account report (async — returns a job handle). |
| `GetAccountReportInfo(GetAccountReportInfoRequest)`             |  ▶   | Poll report status.                                        |
| `SubscribeAccountReportInfo(SubscribeAccountReportInfoRequest)` |  ⇉   | Stream report status updates instead of polling.           |

### `client.metrics` — `UsageMetricsService`

| Method                                    | Kind | Purpose                                        |
| ----------------------------------------- | :--: | ---------------------------------------------- |
| `GetUsageMetrics(GetUsageMetricsRequest)` |  ▶   | API usage / quota stats for the current token. |

### Client lifecycle

| Operation        | Sync                                                                                                      | Async                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Construct        | `TradeAPIClient(secret, *, endpoint=DEFAULT_ENDPOINT, retry_policy=DEFAULT_POLICY, channel_options=None)` | `AsyncTradeAPIClient(secret, ...)` — same args                        |
| Start            | _immediate, blocks for initial JWT_                                                                       | `await client.start()` — or use `async with`                          |
| Current JWT      | `client.get_token()` → `str \| None`                                                                      | `client.get_token()` → `str \| None` (sync read of cached snapshot)   |
| Close            | `client.close()`                                                                                          | `await client.close()`                                                |
| Context manager  | `with TradeAPIClient(...) as client:`                                                                     | `async with AsyncTradeAPIClient(...) as client:`                      |
| Testing (no TLS) | `TradeAPIClient.for_testing(secret, endpoint="localhost:50051")`                                          | `AsyncTradeAPIClient.for_testing(secret, endpoint="localhost:50051")` |

> `for_testing(...)` opens an insecure (plaintext) channel against an in-process fake server. **Never use against `api.limeint.eu`** — it sends your JWT in clear.

## Error handling

Wrap raw `grpc.RpcError` into a typed `TradeAPIError`:

```python
import grpc
from trade_api import TradeAPIClient, RateLimitError, from_rpc_error

with TradeAPIClient(secret="...") as client:
    try:
        client.accounts.GetAccount(GetAccountRequest(account_id="A12345"))
    except grpc.RpcError as raw:
        err = from_rpc_error(raw)
        if isinstance(err, RateLimitError):
            ...
        raise err
```

Exception classes: `AuthError` (401), `PermissionDeniedError` (403),
`InvalidArgumentError` (400), `NotFoundError` (404), `RateLimitError` (429),
`InternalError` (500), `ServiceUnavailableError` (503), `DeadlineExceededError` (504).
All inherit from `TradeAPIError`.

## Retries

Unary RPCs are retried automatically on `UNAVAILABLE` and `RESOURCE_EXHAUSTED`
with exponential backoff + jitter. Streaming RPCs are _not_ retried — the
caller is expected to handle reconnection at a meaningful boundary
(e.g. resuming from the last received bar).

Override the policy:

```python
from trade_api import TradeAPIClient, RetryPolicy

policy = RetryPolicy(max_attempts=6, initial_backoff=0.5, max_backoff=10.0)
client = TradeAPIClient(secret="...", retry_policy=policy)
```

## Local build

From the repository root:

```sh
cd sdk/python
uv sync --locked
uv run ./scripts/generate_proto.sh
uv run ruff check trade_api examples tests
uv run mypy trade_api examples
uv run pytest
```

`scripts/generate_proto.sh` compiles the `.proto` files in `../../proto/` into
`trade_api/proto/`. Re-run it whenever the protos change.

## Layout

```
sdk/python/
├── pyproject.toml
├── uv.lock
├── README.md
├── LICENSE
├── scripts/
│   └── generate_proto.sh      # protoc invocation (contributors only)
├── examples/                   # runnable scripts
└── trade_api/
    ├── __init__.py
    ├── client.py               # TradeAPIClient (sync)
    ├── aio.py                  # AsyncTradeAPIClient
    ├── auth.py                 # JWT lifecycle
    ├── retry.py                # retry policy + interceptors
    ├── exceptions.py           # typed errors
    ├── _insecure_auth.py       # plaintext test-channel authentication
    ├── _metadata.py            # Authorization header plumbing
    ├── _services.py            # lazy generated-service registry
    ├── accounts.py             # message re-exports (per-service)
    ├── assets.py
    ├── auth_messages.py
    ├── market_data.py
    ├── orders.py
    ├── reports.py
    ├── metrics.py
    └── proto/                  # generated by CI; ships in wheel and sdist
```
