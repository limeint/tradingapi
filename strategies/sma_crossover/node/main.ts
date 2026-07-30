import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { withTradeApi, type TradeApi } from "@limeint/trade-api";
import { TimeFrame, type Bar } from "@limeint/trade-api/market-data";
import {
  OrderType,
  Side,
  TimeInForce,
  orderStatusToJSON,
} from "@limeint/trade-api/orders";

import { evaluate, type Signal } from "./strategy.js";

const TIMEFRAMES = {
  M1: [TimeFrame.TIME_FRAME_M1, 7],
  M5: [TimeFrame.TIME_FRAME_M5, 14],
  M15: [TimeFrame.TIME_FRAME_M15, 30],
  M30: [TimeFrame.TIME_FRAME_M30, 30],
  H1: [TimeFrame.TIME_FRAME_H1, 30],
  H2: [TimeFrame.TIME_FRAME_H2, 30],
  H4: [TimeFrame.TIME_FRAME_H4, 30],
  H8: [TimeFrame.TIME_FRAME_H8, 30],
  D: [TimeFrame.TIME_FRAME_D, 180],
  W: [TimeFrame.TIME_FRAME_W, 365 * 2],
  MN: [TimeFrame.TIME_FRAME_MN, 365 * 5],
  QR: [TimeFrame.TIME_FRAME_QR, 365 * 5],
} as const;

type TimeframeName = keyof typeof TIMEFRAMES;
type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR";

export type Config = Readonly<{
  secret: string;
  accountId?: string;
  symbol: string;
  timeframe: TimeframeName;
  quantity: number;
  execute: boolean;
  check: boolean;
  logLevel: LogLevel;
}>;

export type StrategyApi = Readonly<{
  marketData: Pick<TradeApi["marketData"], "bars" | "subscribeBars">;
  accounts: Pick<TradeApi["accounts"], "getAccount">;
  orders: Pick<TradeApi["orders"], "placeOrder">;
}>;

const LOG_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARNING: 30,
  ERROR: 40,
};

const log = (config: Config, level: LogLevel, message: string): void => {
  if (LOG_PRIORITY[level] < LOG_PRIORITY[config.logLevel]) return;
  if (level === "ERROR") console.error(message);
  else if (level === "WARNING") console.warn(message);
  else console.info(message);
};

const barKey = (bar: Pick<Bar, "timestamp">): number => {
  if (!bar.timestamp) throw new Error("bar timestamp is missing");
  return bar.timestamp.getTime();
};

export const orderedBars = (bars: readonly Bar[]): Bar[] => {
  const byTimestamp = new Map<number, Bar>();
  for (const bar of bars) byTimestamp.set(barKey(bar), bar);
  return [...byTimestamp.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, bar]) => bar);
};

const decimal = (value: { value: string } | undefined): number => {
  const parsed = Number(value?.value ?? "0");
  if (!Number.isFinite(parsed)) throw new Error(`invalid decimal: ${value?.value}`);
  return parsed;
};

const history = async (
  api: StrategyApi,
  config: Config,
  now = new Date(),
): Promise<{ closes: number[]; pending: Bar }> => {
  const [timeframe, lookbackDays] = TIMEFRAMES[config.timeframe];
  const response = await api.marketData.bars({
    symbol: config.symbol,
    timeframe,
    interval: {
      startTime: new Date(now.getTime() - lookbackDays * 86_400_000),
      endTime: now,
    },
  });
  const bars = orderedBars(response.bars);
  if (bars.length < 31) {
    throw new Error(`at least 31 historical bars are required; received ${bars.length}`);
  }

  return {
    closes: bars.slice(0, -1).map((bar) => decimal(bar.close)),
    pending: bars.at(-1)!,
  };
};

const position = async (
  api: StrategyApi,
  accountId: string,
  symbol: string,
): Promise<number> => {
  const account = await api.accounts.getAccount({ accountId });
  return decimal(account.positions.find((item) => item.symbol === symbol)?.quantity);
};

export const placeOrder = async (
  api: StrategyApi,
  config: Config,
  signal: Signal,
  bar: Bar,
): Promise<void> => {
  if (!signal) return;
  if (!config.execute) {
    log(config, "WARNING", `DRY RUN: ${signal} ${config.quantity} units of ${config.symbol}`);
    return;
  }

  const current = await position(api, config.accountId!, config.symbol);
  if (signal === "entry" && current !== 0) {
    log(config, "WARNING", `Skipping entry: current position is ${current}, expected zero`);
    return;
  }
  if (signal === "exit" && current <= 0) {
    log(config, "WARNING", "Skipping exit: there is no long position");
    return;
  }

  const side = signal === "entry" ? Side.SIDE_BUY : Side.SIDE_SELL;
  const quantity = signal === "entry" ? config.quantity : Math.min(current, config.quantity);
  const seconds = Math.floor(barKey(bar) / 1_000).toString().slice(-10).padStart(10, "0");
  const state = await api.orders.placeOrder(
    {
      accountId: config.accountId!,
      symbol: config.symbol,
      quantity: { value: String(quantity) },
      side,
      type: OrderType.ORDER_TYPE_MARKET,
      timeInForce: TimeInForce.TIME_IN_FORCE_DAY,
      clientOrderId: `sma9x30-${signal === "entry" ? "b" : "s"}-${seconds}`,
      comment: "SMA 9/30 crossover",
    },
    { retry: false },
  );
  log(
    config,
    "WARNING",
    `Submitted order ${state.orderId}: ${orderStatusToJSON(state.status)}`,
  );
};

export const run = async (api: StrategyApi, config: Config): Promise<void> => {
  let { closes, pending } = await history(api, config);
  let result = evaluate(closes);
  log(
    config,
    "INFO",
    `History ready: close=${closes.at(-1)} sma9=${result.fast} sma30=${result.slow}`,
  );

  if (config.check) {
    console.log(
      `History check passed: close=${closes.at(-1)} sma9=${result.fast} ` +
        `sma30=${result.slow} signal=${result.signal ?? "none"}`,
    );
    return;
  }

  const [timeframe] = TIMEFRAMES[config.timeframe];
  for await (const response of api.marketData.subscribeBars({
    symbol: config.symbol,
    timeframe,
  })) {
    for (const bar of orderedBars(response.bars)) {
      if (barKey(bar) < barKey(pending)) continue;
      if (barKey(bar) === barKey(pending)) {
        pending = bar;
        continue;
      }

      closes = [...closes, decimal(pending.close)].slice(-31);
      result = evaluate(closes);
      log(
        config,
        "INFO",
        `Closed bar: close=${closes.at(-1)} sma9=${result.fast} ` +
          `sma30=${result.slow} signal=${result.signal ?? "none"}`,
      );
      await placeOrder(api, config, result.signal, pending);
      pending = bar;
    }
  }
};

const isTimeframe = (value: string): value is TimeframeName => value in TIMEFRAMES;
const isLogLevel = (value: string): value is LogLevel => value in LOG_PRIORITY;

export const parseConfig = (
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>> = process.env,
): Config => {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      secret: { type: "string" },
      "account-id": { type: "string" },
      symbol: { type: "string" },
      timeframe: { type: "string" },
      quantity: { type: "string" },
      execute: { type: "boolean", default: false },
      check: { type: "boolean", default: false },
      "log-level": { type: "string" },
    },
    strict: true,
  });

  const secret = values.secret ?? env.TRADE_API_SECRET;
  const accountId = values["account-id"] ?? env.TRADE_API_ACCOUNT_ID;
  const symbol = values.symbol ?? env.TRADE_API_SYMBOL;
  const timeframe = (values.timeframe ?? env.TRADE_API_TIMEFRAME ?? "M5").toUpperCase();
  const quantity = Number(values.quantity ?? env.TRADE_API_QUANTITY ?? "1");
  const logLevel = (values["log-level"] ?? env.TRADE_API_LOG_LEVEL ?? "INFO").toUpperCase();

  if (!secret) throw new Error("--secret or TRADE_API_SECRET is required");
  if (!symbol?.includes("@")) {
    throw new Error("--symbol must use ticker@mic format, for example SBER@MISX");
  }
  if (!isTimeframe(timeframe)) throw new Error(`unsupported timeframe: ${timeframe}`);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("--quantity must be a positive number");
  }
  if (!isLogLevel(logLevel)) throw new Error(`unsupported log level: ${logLevel}`);
  if (values.check && values.execute) throw new Error("--check and --execute cannot be combined");
  if (values.execute && !accountId) {
    throw new Error("--account-id or TRADE_API_ACCOUNT_ID is required with --execute");
  }

  return {
    secret,
    accountId,
    symbol,
    timeframe,
    quantity,
    execute: values.execute,
    check: values.check,
    logLevel,
  };
};

const USAGE = `Usage:
  npm start -- --symbol SBER@MISX [--timeframe M5] [--quantity 1]
  npm start -- --symbol SBER@MISX --check
  npm start -- --symbol SBER@MISX --account-id A123 --execute

TRADE_API_SECRET is required. Dry-run is the default.`;

const main = async (): Promise<void> => {
  if (process.argv.includes("--help")) {
    console.log(USAGE);
    return;
  }
  const config = parseConfig(process.argv.slice(2));
  if (!config.execute && !config.check) {
    log(config, "WARNING", "Dry-run mode: signals are logged but orders are disabled");
  }
  await withTradeApi({ secret: config.secret }, (api) => run(api, config));
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
