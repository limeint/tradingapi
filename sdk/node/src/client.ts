import { setTimeout as delay } from "node:timers/promises";

import {
  ChannelCredentials,
  ClientError,
  Metadata,
  Status,
  createChannel,
  createClient,
  createClientFactory,
  type ChannelOptions,
  type ClientMiddleware,
} from "nice-grpc";
import {
  retryMiddleware,
  type RetryOptions,
} from "nice-grpc-client-middleware-retry";

import {
  AccountsServiceDefinition,
  type AccountsServiceClient,
} from "./generated/grpc/tradeapi/v1/accounts/accounts_service.js";
import {
  AssetsServiceDefinition,
  type AssetsServiceClient,
} from "./generated/grpc/tradeapi/v1/assets/assets_service.js";
import {
  AuthServiceDefinition,
  type AuthServiceClient,
} from "./generated/grpc/tradeapi/v1/auth/auth_service.js";
import {
  CorporateActionsServiceDefinition,
  type CorporateActionsServiceClient,
} from "./generated/grpc/tradeapi/v1/corporateactions/corporate_actions_service.js";
import {
  MarketDataServiceDefinition,
  type MarketDataServiceClient,
} from "./generated/grpc/tradeapi/v1/marketdata/marketdata_service.js";
import {
  UsageMetricsServiceDefinition,
  type UsageMetricsServiceClient,
} from "./generated/grpc/tradeapi/v1/metrics/usage_metrics_service.js";
import {
  OrdersServiceDefinition,
  type OrdersServiceClient,
} from "./generated/grpc/tradeapi/v1/orders/orders_service.js";
import {
  ReportsServiceDefinition,
  type ReportsServiceClient,
} from "./generated/grpc/tradeapi/v1/reports/reports_service.js";
import { toTradeApiError } from "./errors.js";

export const DEFAULT_ENDPOINT = "api.finam.ru:443";

export type RetryPolicy = Readonly<{
  /** Total attempts including the initial call. */
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
}>;

export const DEFAULT_RETRY_POLICY: RetryPolicy = Object.freeze({
  maxAttempts: 4,
  initialBackoffMs: 200,
  maxBackoffMs: 5_000,
});

export type TradeApiOptions = Readonly<{
  secret: string;
  endpoint?: string;
  sourceAppId?: string;
  retry?: Partial<RetryPolicy> | false;
  channelOptions?: ChannelOptions;
  /**
   * Use plaintext transport for a local test server.
   * Never enable this for a production endpoint.
   */
  insecure?: boolean;
  onRenewalError?: (error: unknown, retryInMs: number) => void;
}>;

export type TradeApi = Readonly<{
  auth: AuthServiceClient<RetryOptions>;
  accounts: AccountsServiceClient<RetryOptions>;
  assets: AssetsServiceClient<RetryOptions>;
  corporateActions: CorporateActionsServiceClient<RetryOptions>;
  marketData: MarketDataServiceClient<RetryOptions>;
  orders: OrdersServiceClient<RetryOptions>;
  reports: ReportsServiceClient<RetryOptions>;
  metrics: UsageMetricsServiceClient<RetryOptions>;
  getToken: () => string;
  close: () => Promise<void>;
}>;

const authorization =
  (getToken: () => string): ClientMiddleware =>
  async function* (call, options) {
    const metadata = Metadata(options.metadata);
    metadata.set("authorization", getToken());
    return yield* call.next(call.request, { ...options, metadata });
  };

const mapErrors: ClientMiddleware = async function* (call, options) {
  try {
    return yield* call.next(call.request, options);
  } catch (error) {
    if (error instanceof ClientError) throw toTradeApiError(error);
    throw error;
  }
};

const retryOptions = (
  policy: TradeApiOptions["retry"],
): RetryOptions => {
  if (policy === false) return { retry: false };

  const resolved = { ...DEFAULT_RETRY_POLICY, ...policy };
  if (!Number.isInteger(resolved.maxAttempts) || resolved.maxAttempts < 1) {
    throw new RangeError("retry.maxAttempts must be a positive integer");
  }

  return {
    retry: true,
    retryMaxAttempts: resolved.maxAttempts - 1,
    retryBaseDelayMs: resolved.initialBackoffMs,
    retryMaxDelayMs: resolved.maxBackoffMs,
    retryableStatuses: [Status.UNAVAILABLE],
  };
};

const renewToken = async (
  auth: AuthServiceClient,
  request: { secret: string; sourceAppId: string },
  signal: AbortSignal,
  setToken: (token: string) => void,
  onError?: TradeApiOptions["onRenewalError"],
): Promise<void> => {
  let backoffMs = 1_000;

  while (!signal.aborted) {
    try {
      for await (const update of auth.subscribeJwtRenewal(request, { signal })) {
        setToken(update.token);
        backoffMs = 1_000;
      }
    } catch (error) {
      if (signal.aborted) break;
      try {
        onError?.(error, backoffMs);
      } catch {
        // An observer must not stop authentication renewal.
      }
    }

    if (signal.aborted) break;
    try {
      await delay(backoffMs, undefined, { signal });
    } catch {
      break;
    }
    backoffMs = Math.min(backoffMs * 2, 30_000);
  }
};

/**
 * Create a ready-to-use Trade API client.
 *
 * The initial JWT is fetched before this promise resolves. Every service call
 * receives the latest token automatically; server streams are AsyncIterables.
 */
export const createTradeApi = async (
  options: TradeApiOptions,
): Promise<TradeApi> => {
  const credentials = options.insecure
    ? ChannelCredentials.createInsecure()
    : ChannelCredentials.createSsl();
  const channel = createChannel(
    options.endpoint ?? DEFAULT_ENDPOINT,
    credentials,
    options.channelOptions,
  );
  const rawAuth = createClient(AuthServiceDefinition, channel);
  const request = {
    secret: options.secret,
    sourceAppId: options.sourceAppId ?? "",
  };

  let token: string;
  try {
    token = (await rawAuth.auth(request)).token;
  } catch (error) {
    channel.close();
    throw toTradeApiError(error);
  }

  const factory = createClientFactory()
    .use(authorization(() => token))
    .use(retryMiddleware)
    .use(mapErrors);
  const defaults = { "*": retryOptions(options.retry) } as const;
  const abort = new AbortController();
  const renewal = renewToken(
    rawAuth,
    request,
    abort.signal,
    (nextToken) => {
      token = nextToken;
    },
    options.onRenewalError,
  );
  let closed = false;

  return {
    auth: factory.create(AuthServiceDefinition, channel, defaults),
    accounts: factory.create(AccountsServiceDefinition, channel, defaults),
    assets: factory.create(AssetsServiceDefinition, channel, defaults),
    corporateActions: factory.create(
      CorporateActionsServiceDefinition,
      channel,
      defaults,
    ),
    marketData: factory.create(MarketDataServiceDefinition, channel, defaults),
    orders: factory.create(OrdersServiceDefinition, channel, defaults),
    reports: factory.create(ReportsServiceDefinition, channel, defaults),
    metrics: factory.create(UsageMetricsServiceDefinition, channel, defaults),
    getToken: () => token,
    close: async () => {
      if (closed) return;
      closed = true;
      abort.abort();
      channel.close();
      await renewal;
    },
  };
};

/** Run work with a client and always close its channel and renewal stream. */
export const withTradeApi = async <Result>(
  options: TradeApiOptions,
  run: (client: TradeApi) => Result | Promise<Result>,
): Promise<Result> => {
  const client = await createTradeApi(options);
  try {
    return await run(client);
  } finally {
    await client.close();
  }
};
