import type { Channel, ClientFactory } from "nice-grpc";
import type { RetryOptions } from "nice-grpc-client-middleware-retry";
import type { AccountsServiceClient } from "../generated/grpc/tradeapi/v1/accounts/accounts_service.js";
import { AccountsServiceDefinition } from "../generated/grpc/tradeapi/v1/accounts/accounts_service.js";
import type { AssetsServiceClient } from "../generated/grpc/tradeapi/v1/assets/assets_service.js";
import { AssetsServiceDefinition } from "../generated/grpc/tradeapi/v1/assets/assets_service.js";
import type { AuthServiceClient } from "../generated/grpc/tradeapi/v1/auth/auth_service.js";
import { AuthServiceDefinition } from "../generated/grpc/tradeapi/v1/auth/auth_service.js";
import type { CorporateActionsServiceClient } from "../generated/grpc/tradeapi/v1/corporateactions/corporate_actions_service.js";
import { CorporateActionsServiceDefinition } from "../generated/grpc/tradeapi/v1/corporateactions/corporate_actions_service.js";
import type { MarketDataServiceClient } from "../generated/grpc/tradeapi/v1/marketdata/marketdata_service.js";
import { MarketDataServiceDefinition } from "../generated/grpc/tradeapi/v1/marketdata/marketdata_service.js";
import type { UsageMetricsServiceClient } from "../generated/grpc/tradeapi/v1/metrics/usage_metrics_service.js";
import { UsageMetricsServiceDefinition } from "../generated/grpc/tradeapi/v1/metrics/usage_metrics_service.js";
import type { OrdersServiceClient } from "../generated/grpc/tradeapi/v1/orders/orders_service.js";
import { OrdersServiceDefinition } from "../generated/grpc/tradeapi/v1/orders/orders_service.js";

export type ServiceClients = Readonly<{
  auth: AuthServiceClient<RetryOptions>;
  accounts: AccountsServiceClient<RetryOptions>;
  assets: AssetsServiceClient<RetryOptions>;
  corporateActions: CorporateActionsServiceClient<RetryOptions>;
  marketData: MarketDataServiceClient<RetryOptions>;
  orders: OrdersServiceClient<RetryOptions>;
  metrics: UsageMetricsServiceClient<RetryOptions>;
}>;

export const createServiceClients = (
  factory: ClientFactory<RetryOptions>,
  channel: Channel,
  retry: RetryOptions,
): ServiceClients => {
  const defaults = { "*": retry } as const;

  return {
    auth: factory.create(AuthServiceDefinition, channel, defaults),
    accounts: factory.create(AccountsServiceDefinition, channel, defaults),
    assets: factory.create(AssetsServiceDefinition, channel, defaults),
    corporateActions: factory.create(CorporateActionsServiceDefinition, channel, defaults),
    marketData: factory.create(MarketDataServiceDefinition, channel, defaults),
    orders: factory.create(OrdersServiceDefinition, channel, defaults),
    metrics: factory.create(UsageMetricsServiceDefinition, channel, defaults),
  };
};
