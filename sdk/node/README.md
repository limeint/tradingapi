# Limeint Trade API — Node.js SDK

A small, functional TypeScript SDK around Limeint's gRPC Trade API.

- one async `createTradeApi()` entry point;
- plain objects for requests—no message constructors;
- Promises for unary RPCs and `AsyncIterable` for streams;
- automatic JWT issuance, injection, and renewal;
- typed errors and transient-failure retries;
- generated types for the complete protobuf API.

## Installation

Node.js 20 or newer is required.

```sh
npm install @limeint/trade-api
```

## Quickstart

`withTradeApi()` closes the channel and token-renewal stream for you:

```ts
import { withTradeApi } from "@limeint/trade-api";

await withTradeApi(
  { secret: process.env.TRADE_API_SECRET! },
  async (api) => {
    const account = await api.accounts.getAccount({
      accountId: "A12345",
    });
    console.log(account);

    for await (const update of api.marketData.subscribeQuote({
      symbols: ["SBER@MISX"],
    })) {
      console.log(update);
    }
  },
);
```

For a long-lived application, manage the client explicitly:

```ts
import { createTradeApi } from "@limeint/trade-api";

const api = await createTradeApi({
  secret: process.env.TRADE_API_SECRET!,
});

try {
  const details = await api.auth.tokenDetails({ token: api.getToken() });
  console.log(details.accountIds);
} finally {
  await api.close();
}
```

## Services

The returned object exposes generated methods directly:

| Property | Service | Examples |
| --- | --- | --- |
| `auth` | `AuthService` | `tokenDetails` |
| `accounts` | `AccountsService` | `getAccount`, `trades`, `subscribeAccount` |
| `assets` | `AssetsService` | `allAssets`, `getAsset`, `schedule` |
| `corporateActions` | `CorporateActionsService` | splits, bonds, dividends |
| `marketData` | `MarketDataService` | `bars`, `lastQuote`, quote/book/bar streams |
| `orders` | `OrdersService` | place, cancel, query, order/trade streams |
| `reports` | `ReportsService` | create, query, and subscribe to reports |
| `metrics` | `UsageMetricsService` | `getUsageMetrics` |

Request fields use idiomatic lower camel case. TypeScript checks every plain
object against the generated protobuf type:

```ts
import { OrderType, Side, TimeInForce } from "@limeint/trade-api/orders";

const order = await api.orders.placeOrder({
  accountId: "A12345",
  symbol: "SBER@MISX",
  quantity: { value: "1" },
  side: Side.SIDE_BUY,
  type: OrderType.ORDER_TYPE_LIMIT,
  timeInForce: TimeInForce.TIME_IN_FORCE_DAY,
  limitPrice: { value: "280.00" },
  clientOrderId: crypto.randomUUID().replaceAll("-", "").slice(0, 20),
});
```

Generated types and enums are available through per-service imports:

```ts
import type { GetAccountResponse } from "@limeint/trade-api/accounts";
import { TimeFrame } from "@limeint/trade-api/market-data";
import { OrderType, Side } from "@limeint/trade-api/orders";
```

Protobuf timestamps map to `Date`, 64-bit integers map to `bigint`, and
`google.type.Decimal` is represented as `{ value: string }`.

## Streaming and cancellation

Server streams are normal async iterables. Pass an `AbortSignal` to cancel:

```ts
const abort = new AbortController();

process.once("SIGINT", () => abort.abort());

for await (const update of api.marketData.subscribeQuote(
  { symbols: ["SBER@MISX"] },
  { signal: abort.signal },
)) {
  console.log(update);
}
```

Streams are not automatically retried because only the application knows how
to resume without losing or duplicating events.

## Errors and retries

gRPC failures are mapped automatically to `TradeApiError` subclasses:
`AuthError`, `PermissionDeniedError`, `InvalidArgumentError`,
`NotFoundError`, `RateLimitError`, `InternalError`,
`ServiceUnavailableError`, and `DeadlineExceededError`.

```ts
import { RateLimitError } from "@limeint/trade-api";

try {
  await api.assets.getAsset({ symbol: "UNKNOWN@XXXX" });
} catch (error) {
  if (error instanceof RateLimitError) {
    // Back off or queue the request.
  }
  throw error;
}
```

Unary calls retry `UNAVAILABLE` three times by default with exponential
backoff, matching the Python SDK's four total attempts. Disable retries
globally with `retry: false`, customize the policy when creating the client,
or override it for one call:

```ts
await api.orders.placeOrder(order, { retry: false });
```

For state-changing RPCs, use a stable idempotency identifier such as
`clientOrderId`, or disable retries for that call.

## Local development

From `sdk/node`:

```sh
npm install
npm run generate
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

Run `npm run generate` whenever files under `../../proto` change. Generated
files are committed so SDK consumers never need `protoc`.

Release maintainers should follow [RELEASING.md](./RELEASING.md).
