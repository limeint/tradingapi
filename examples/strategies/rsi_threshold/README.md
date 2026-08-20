# Limeint RSI 14 threshold

A long-only RSI strategy that buys weakness and sells strength, implemented once
per language against the corresponding published Trade API SDK.

| Language | Implementation | SDK |
| --- | --- | --- |
| Python | [`python/`](python/) | `limeint-sdk` |
| Node.js | [`node/`](node/) | `@limeint/trade-api` |

## Quick start: read-only history check

Run one implementation from the repository root. Check mode authenticates,
fetches historical bars, prints the latest confirmed RSI, and exits. It does not
inspect an account, open a live subscription, or place an order.

```sh
# Python 3.10+ and uv
cd examples/strategies/rsi_threshold/python
uv sync --locked
TRADE_API_SECRET=... uv run python main.py --symbol AAPL@XNGS --check
```

```sh
# Node.js 20+
cd examples/strategies/rsi_threshold/node
npm ci
TRADE_API_SECRET=... npm start -- --symbol AAPL@XNGS --check
```

Expected output starts with:

```text
History check passed: close=... rsi=... average_gain=... average_loss=... signal=...
```

This page describes the strategy itself: the rule, how candles are handled, and
the safety guards every implementation must honor. Each language directory has
its own README covering only installation, running, and tests for that
ecosystem.

## The rule

The Relative Strength Index compares average gains to average losses over the
last 14 completed candles. A low reading means losses dominated the window, a
high reading means gains did.

- **Entry:** RSI below **0.2** while the strategy is flat.
- **Exit:** RSI above **0.8** while the strategy holds a position.
- Wilder's average gain and average loss are calculated and logged for context.
  Neither rule reads them directly; both compare the ratio.
- Averages use completed candle close prices.
- No signal is emitted while the averages are warming up.

This is a mean-reversion rule: it buys into a sell-off and sells into a rally,
which is the opposite of the trend-following behavior in the SMA and MACD
examples. It can therefore enter while a price is still falling and hold through
further declines.

### Scale: 0.2 and 0.8, not 20 and 80

RSI is often published on a 0–100 scale, where these levels are the familiar
oversold/overbought pair **20 and 80**. This strategy keeps the ratio on its
natural **0..1** scale, so `0.2` and `0.8` here mean exactly the same levels.
Multiply any logged `rsi` value by 100 to compare it with a charting package.

The implementations calculate `average_gain / (average_gain + average_loss)`,
which is the usual `100 - 100 / (1 + gain / loss)` formula rearranged. The two
agree everywhere, but this form needs no special case for a window without
losses. A window with no gains *and* no losses — a completely flat price —
leaves the ratio undefined; both implementations report the midpoint `0.5`,
which sits between the levels, so a stalled feed cannot by itself open a trade.

### Levels, not crossings

Both rules test the current reading against a level. Neither compares it with
the previous candle, so RSI staying below 0.2 for ten candles satisfies the
entry condition on all ten. What stops a second entry is the position state
described in [How the position is tracked](#how-the-position-is-tracked), not
the rule. That is the single most important thing to understand before copying
this example: `evaluate` is only safe to call in a loop if the caller feeds its
own position back in.

The two rules are also independent — the bands do not overlap — so:

- an oversold reading while already holding does not add to the position;
- an overbought reading while flat is not an exit;
- a position can be held for a long time, because the price has to travel from
  one extreme to the other before the exit fires;
- between 0.2 and 0.8 nothing happens at all, whatever the position.

### Warm-up

The averages cover 14 price changes, and the first change also needs the close
before it, so an evaluation needs **15 completed closes** — 16 candles, because
the newest one is still pending. `--check` fails with a clear message when the
requested timeframe cannot supply them.

Wilder's smoothing carries its whole history, so a value depends on where the
average started. Implementations seed the first average with a simple mean and
keep the last 140 closes (ten periods) while streaming. That is far enough back
that the seed no longer measurably affects the newest reading, so a restarted
process converges on the same RSI.

## Data and execution flow

```text
market_data.Bars ───────┐
                        ├─> completed candles ─> RSI 14 ─> signal
market_data.SubscribeBars┘                                 │
                                                          ├─> dry-run log
auth.TokenDetails ─> account ID ───────────────────────────┤
accounts.GetAccount ───────────────────────────────────────┤
orders.PlaceOrder <────────────────────────────────────────┘
```

Each SDK already provides all required operations. An implementation should not
import generated stubs directly or build its own transport.

## How completed candles are handled

The newest historical or streamed candle is kept pending. Updates carrying the
same timestamp replace it. Only a bar with a later timestamp confirms that the
pending candle has closed, at which point it is passed to the RSI calculation.

Historical bars warm up the averages without placing orders.

## How the position is tracked

Because both rules are levels rather than crossings, the strategy has to know
whether it is holding. Every implementation keeps one in-memory flag:

- it starts flat on every run and never adopts a position it did not open;
- the flag follows what an acted-on signal implies: long after an entry, flat
  after an exit;
- an entry blocked by a safety guard is not adopted, so the strategy stays flat
  and remains free to act on the next signal;
- an exit blocked because the account holds nothing still clears the flag — the
  guard has just confirmed the strategy is flat, so an order that never filled
  cannot strand it;
- a dry run sets the flag too, which is what makes its log alternate between
  entry and exit instead of repeating an entry on every oversold candle.

The flag lives in memory. A restarted process is flat again, whatever the
account holds. Restarting during an oversold stretch will therefore open a
position that the previous process had already opened, which the entry guard
below blocks in execute mode.

## Safety guards

Dry-run is the default. Reading market data and printing signals does not inspect
token accounts and must never read an account or place an order. Real trading
requires an explicit opt-in flag. At startup, the strategy retrieves the account
ID from `AuthService.TokenDetails` and refuses to trade unless the token exposes
exactly one account.

Before an order is submitted:

- entry requires the current position to be exactly zero;
- exit requires a positive long position;
- exit quantity is capped by the current long position, preventing a new short;
- the signal candle produces a deterministic client order ID.

Use a dedicated account for this example. The API exposes the aggregate position
for a symbol, so the process cannot distinguish a manual position from one
opened by the strategy. Real market orders also carry price and liquidity risk.

## Configuration

Every implementation reads the same settings from flags or environment
variables. One shared file at the repository root supplies them, and every
`just` recipe loads it automatically:

```sh
# From the repository root
cp .env.example .env
# Edit .env, then:
just run-strategy-python rsi_threshold --check
just run-strategy-node rsi_threshold --check
```

The programs themselves never read `.env`. To start one directly from its
language directory instead, export the file first:

```sh
set -a
source ../../../../.env
set +a
```

The repository ignores `.env`; never commit real secrets. Values already
exported in your shell win over the file.

| Environment variable | Required | Default |
| --- | --- | --- |
| `TRADE_API_SECRET` | Yes, unless `--secret` is used | — |
| `TRADE_API_SYMBOL` | Yes, unless `--symbol` is used | — |
| `TRADE_API_TIMEFRAME` | No | `M5` |
| `TRADE_API_QUANTITY` | No | `1` |
| `TRADE_API_LOG_LEVEL` | No | `INFO` |

Symbols use `ticker@mic` format, for example `AAPL@XNGS`. Supported timeframes
are `M1`, `M5`, `M15`, `M30`, `H1`, `H2`, `H4`, `H8`, `D`, `W`, `MN`, and `QR`.
The period and both levels are part of the rule and are not configurable from
the command line. `evaluate` takes them as arguments, so a copy of the example
can run other settings by passing them at the call in `runner`:

```python
# Defined in python/strategy.py, called from python/runner.py.
evaluate(closes, in_position, period=14, entry_level=Decimal("0.2"), exit_level=Decimal("0.8"))
```

```ts
// Defined in node/strategy.ts, called from node/runner.ts.
evaluate(closes, inPosition, /* period */ 14, /* entryLevel */ 0.2, /* exitLevel */ 0.8);
```

Levels must satisfy `0 <= entry_level < exit_level <= 1`; anything else raises
before a signal is produced. Both modules derive the warm-up from the period, so
a shorter or longer setting changes how many candles the first signal needs;
`required_closes` and `requiredCloses` report the number.

## Read-only smoke test

Every implementation offers a check mode that authenticates, fetches historical
bars, calculates the latest confirmed RSI, prints one line, and exits without
opening the live subscription, reading an account, or placing an order:

```text
History check passed: close=... rsi=... average_gain=... average_loss=... signal=...
```

Values are rounded to six decimals for display only; the rule compares the full
values.

## What a dry run logs

Without `--check`, the strategy streams and logs one line per completed candle,
plus a warning whenever a signal fires. This excerpt is a sell-off pushing the
ratio below 0.2 and opening a position:

```text
History ready: close=100.26221594277987 rsi=0.558339
Closed bar: close=99.35551757554535 rsi=0.409960 average_gain=0.099908 average_loss=0.143794 signal=none
Closed bar: close=98.27792419044236 rsi=0.305910 average_gain=0.092772 average_loss=0.210494 signal=none
Closed bar: close=97.14548127769474 rsi=0.237647 average_gain=0.086146 average_loss=0.276348 signal=none
Closed bar: close=96.10407145930658 rsi=0.194634 average_gain=0.079992 average_loss=0.330995 signal=entry
DRY RUN: entry 2 units of AAPL@XNGS
```

Both implementations emit the same message text. Python routes it through
`logging`, so each line also carries a timestamp, level, and logger name;
Node.js prints the message alone. `--log-level WARNING` keeps only the signal
and order lines.

In execute mode the `DRY RUN` line is replaced by the guard result — a submitted
order with its ID and status, or the reason the order was skipped.

## Scope

This is learning material, not a production trading system. Applications derived
from it still need persistent state, stream reconnection, missed-bar backfill,
monitoring, risk limits, reconciliation, and operational controls appropriate to
their use case. Position tracking in particular is in-memory only, which a real
application would replace with reconciled, persisted state. A mean-reversion
rule with no stop also has no built-in answer to a price that keeps falling
after an entry; adding one is left to the reader.
