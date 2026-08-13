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

This checkout currently targets `2.18.2`:

```sh
npm install @limeint/trade-api@2.18.2
```

## Quick start

The first program below authenticates and prints the account IDs visible to the
secret. It is bounded and does not place an order.

Create a clean application directory:

```sh
mkdir limeint-node-quickstart
cd limeint-node-quickstart
npm init -y
npm install @limeint/trade-api@2.18.2
```

Save this as `quickstart.mjs`. The `.mjs` extension makes the SDK's ESM import
work without additional project configuration:

```ts
import { withTradeApi } from "@limeint/trade-api";

const secret = process.env.TRADE_API_SECRET;
if (!secret) throw new Error("Set TRADE_API_SECRET");

await withTradeApi({ secret }, async (api) => {
  const details = await api.auth.tokenDetails({ token: api.getToken() });
  console.log("Available account IDs:", details.accountIds);
});
```

Run it with your secret:

```sh
TRADE_API_SECRET=... node quickstart.mjs
```

If authentication fails, confirm that the secret is active. An empty account
list means the token does not expose a trading account; it may still be usable
for market data if it has the required entitlement.

`withTradeApi()` always closes the channel and token-renewal stream. Once this
works, save this as another `.mjs` file to fetch an account using one of the
discovered IDs:

```ts
import { withTradeApi } from "@limeint/trade-api";

const secret = process.env.TRADE_API_SECRET;
if (!secret) throw new Error("Set TRADE_API_SECRET");

await withTradeApi({ secret }, async (api) => {
  const details = await api.auth.tokenDetails({ token: api.getToken() });
  const accountId = details.accountIds[0];
  if (!accountId) throw new Error("This secret exposes no accounts");

  const account = await api.accounts.getAccount({ accountId });
  console.log(account);
});
```

## Subscribe to market data

Server streams are async iterables. This example runs until Ctrl-C and closes
cleanly through an `AbortSignal`:

```ts
import { withTradeApi } from "@limeint/trade-api";

const secret = process.env.TRADE_API_SECRET;
if (!secret) throw new Error("Set TRADE_API_SECRET");

const abort = new AbortController();
process.once("SIGINT", () => abort.abort());

await withTradeApi({ secret }, async (api) => {
  for await (const update of api.marketData.subscribeQuote(
    { symbols: ["AAPL@XNAS"] },
    { signal: abort.signal },
  )) {
    console.log(update);
  }
});
```

The repository also includes focused examples for
[authentication and accounts](../../examples/sdk/node/auth-and-account.ts),
[quote streaming](../../examples/sdk/node/subscribe-quotes.ts), and
[real order placement](../../examples/sdk/node/place-limit-order.ts). They live
in a [standalone consumer project](../../examples/sdk/node/) that installs the
published package by default.

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

> **Warning:** The following call places a real order. Use a dedicated account,
> validate the account ID and order parameters, and do not use it as your first
> SDK test.

```ts
import { OrderType, Side, TimeInForce } from "@limeint/trade-api/orders";

const order = await api.orders.placeOrder({
  accountId: "A12345",
  symbol: "AAPL@XNAS",
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
  { symbols: ["AAPL@XNAS"] },
  { signal: abort.signal },
)) {
  console.log(update);
}
```

Streams are not automatically retried because only the application knows how
to resume without losing or duplicating events.

## Client lifecycle

Use `withTradeApi()` for bounded work. For a long-lived application, manage the
client explicitly and always close it:

```ts
import { createTradeApi } from "@limeint/trade-api";

const secret = process.env.TRADE_API_SECRET;
if (!secret) throw new Error("Set TRADE_API_SECRET");

const api = await createTradeApi({ secret });
try {
  const details = await api.auth.tokenDetails({ token: api.getToken() });
  console.log(details.accountIds);
} finally {
  await api.close();
}
```

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
npm ci
npm run format
npm run check
npm run build
npm pack --dry-run
```

Run `npm run generate` whenever files under `../../proto` change. Generated
files are build artifacts and are not committed. Package consumers still never
need `protoc` because releases contain the compiled output.

Release maintainers should follow [RELEASING.md](./RELEASING.md).
