# Migrating to the New Trade API

This guide explains how to migrate from the previous Trade API to the new version. The new API provides a more consistent structure, expanded functionality, and improved performance.

## Key Conceptual Changes

Review these architectural changes before comparing individual methods:

1. **Service reorganization:** Functionality is now grouped into logical services. For example, instrument information and market data are exposed through separate `AssetsService` and `MarketDataService` services.
2. **Portfolio → Account:** The portfolio concept has been replaced by an account. Positions, cash, and user trades are now available through `AccountsService`.
3. **Unified order service:** The former `Orders` and `Stops` services are combined in `OrdersService`. Limit and stop orders use the same methods, with the order type specified in the request body.
4. **Granular event subscriptions:** Instead of the single `Events.GetEvents` stream, the new API provides subscriptions for specific data types:
   - `MarketDataService`: quotes, order books, instrument trades, and bars.
   - `OrdersService`: events for the user's own orders and trades.
5. **Dedicated authentication service:** `AuthService` manages access tokens.

## Method Mapping

The following table maps methods from the previous API to their replacements:

| Previous service | Previous method | New service | New method | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `Candles` | `GetDayCandles` | `MarketDataService` | `Bars` | `Bars` replaces both candle methods. Use the `timeframe` parameter to request daily, hourly, or another interval. |
| `Candles` | `GetIntradayCandles` | `MarketDataService` | `Bars` | Same replacement as `GetDayCandles`; specify the required timeframe in the request. |
| `Orders` | `NewOrder` | `OrdersService` | `PlaceOrder` | The functionality is preserved; review the updated `Order` fields. |
| `Orders` | `CancelOrder` | `OrdersService` | `CancelOrder` | The behavior remains the same. |
| `Orders` | `GetOrders` | `OrdersService` | `GetOrders` | Returns active orders for an account. |
| `Stops` | `NewStop` | `OrdersService` | `PlaceOrder` | Submit stop orders through `PlaceOrder` with `ORDER_TYPE_STOP` or `ORDER_TYPE_STOP_LIMIT`. |
| `Stops` | `CancelStop` | `OrdersService` | `CancelOrder` | Cancel a stop order through the standard cancellation method. |
| `Stops` | `GetStops` | `OrdersService` | `GetOrders` | `GetOrders` returns all order types, including stop orders. |
| `Portfolios` | `GetPortfolio` | `AccountsService` | `GetAccount` | Returns account information, including positions and available funds. |
| `Securities` | `GetSecurities` | `AssetsService` | `Assets` | Returns the complete list of tradable instruments. |
| `Events` | `GetEvents` | `MarketDataService` / `OrdersService` | `SubscribeQuote`, `SubscribeOrderBook`, `SubscribeLatestTrades`, `SubscribeBars`, `SubscribeOrderTrade` | The single event stream is split into specialized subscriptions. Choose the method for the required data type. |

## Migration Example: Retrieving Bars

**Previous API:**

Daily and intraday candles required separate methods:

```protobuf
// Request daily candles
rpc GetDayCandles(GetDayCandlesRequest) returns (GetDayCandlesResult);

// Request intraday candles
rpc GetIntradayCandles(GetIntradayCandlesRequest) returns (GetIntradayCandlesResult);
```

**New API:**

Use `Bars` and specify the required interval through `timeframe`:

```protobuf
// Request bars with a specific timeframe
rpc Bars(BarsRequest) returns (BarsResponse);

message BarsRequest {
  string symbol = 1;
  TimeFrame timeframe = 2; // e.g., TIME_FRAME_D for daily, TIME_FRAME_H1 for hourly
  google.type.Interval interval = 3;
}
```

## Conclusion

Review the service structure and models in the `proto` directory before migrating. The new API provides a more flexible foundation for trading applications.

## Support

Replace this section with your brand's developer portal and support channel.
