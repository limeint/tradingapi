import { randomUUID } from "node:crypto";

import { withTradeApi } from "@limeint/trade-api";
import { OrderType, Side, TimeInForce } from "@limeint/trade-api/orders";

const secret = process.env.TRADE_API_SECRET;
const symbol = process.env.TRADE_API_SYMBOL ?? "AAPL@XNAS";

if (!secret) {
  throw new Error("Set TRADE_API_SECRET");
}

await withTradeApi({ secret }, async (api) => {
  const details = await api.auth.tokenDetails({ token: api.getToken() });
  const [accountId] = details.accountIds;
  if (details.accountIds.length !== 1 || !accountId) {
    throw new Error(
      `Expected exactly one available account; received ${details.accountIds.length}`,
    );
  }
  const order = await api.orders.placeOrder({
    accountId,
    symbol,
    quantity: { value: "1" },
    side: Side.SIDE_BUY,
    type: OrderType.ORDER_TYPE_LIMIT,
    timeInForce: TimeInForce.TIME_IN_FORCE_DAY,
    limitPrice: { value: "280.00" },
    clientOrderId: randomUUID().replaceAll("-", "").slice(0, 20),
  });

  console.log("Placed order:", order.orderId);
});
