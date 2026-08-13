# Limeint MACD 12/26/9 zero cross

A long-only MACD strategy, implemented once per language against the
corresponding published Trade API SDK.

| Language | Implementation | SDK |
| --- | --- | --- |
| Python | [`python/`](python/) | `limeint-sdk` |
| Node.js | [`node/`](node/) | `@limeint/trade-api` |

## Quick start: read-only history check

Run one implementation from the repository root. Check mode authenticates,
fetches historical bars, prints the latest confirmed MACD values, and exits. It
does not inspect an account, open a live subscription, or place an order.

```sh
# Python 3.10+ and uv
cd examples/strategies/macd_zero_cross/python
uv sync --locked
TRADE_API_SECRET=... uv run python main.py --symbol AAPL@XNAS --check
```

```sh
# Node.js 20+
cd examples/strategies/macd_zero_cross/node
npm ci
TRADE_API_SECRET=... npm start -- --symbol AAPL@XNAS --check
```

Expected output starts with:

```text
History check passed: close=... macd=... macd_signal=... histogram=... signal=...
```

This page describes the strategy itself: the rule, how candles are handled, and
the safety guards every implementation must honor. Each language directory has
its own README covering only installation, running, and tests for that
ecosystem.

## The rule

The MACD line is the difference between two exponential moving averages of
completed candle closes: `EMA 12 − EMA 26`. Above zero the fast average leads
the slow one, which is read as an upturn.

- **Entry:** previous MACD ≤ 0, and current MACD > 0 — the line crossing zero
  from the negative zone into the positive one, while the strategy is flat.
- **Exit:** two consecutive declining MACD values — `current < previous <
  older` — while the strategy holds a position.
- The signal line (`EMA 9` of the MACD line) and the histogram
  (`MACD − signal line`) are calculated and logged for context. Neither rule
  reads them, so a MACD/signal crossover is not a trade on its own.
- Averages use completed candle close prices.
- No signal is emitted while the averages are warming up.

Entry is an event and exit is a condition, so the two are not symmetric:

- a zero cross while already holding does not add to the position;
- declining values while flat are not an exit;
- the earliest possible exit is the second candle after an entry, because a
  candle that crosses zero upwards is itself a rising candle;
- a MACD line falling back below zero is not by itself an exit. In practice
  the fall produces two declining values first, which is what closes the
  position.

### Warm-up

The first MACD value needs 26 closes. The signal line averages nine MACD values,
adding eight more, so an evaluation needs **34 completed closes** — 35 candles,
because the newest one is still pending. `--check` fails with a clear message
when the requested timeframe cannot supply them.

Unlike a simple moving average, an EMA carries its whole history, so a value
depends on where the average started. Implementations seed the first EMA with a
simple average and keep the last 260 closes (ten slow windows) while streaming.
That is far enough back that the seed no longer measurably affects the newest
MACD value, so a restarted process converges on the same numbers.

## Data and execution flow

```text
market_data.Bars ───────┐
                        ├─> completed candles ─> MACD 12/26/9 ─> signal
market_data.SubscribeBars┘                                      │
                                                               ├─> dry-run log
auth.TokenDetails ─> account ID ────────────────────────────────┤
accounts.GetAccount ────────────────────────────────────────────┤
orders.PlaceOrder <─────────────────────────────────────────────┘
```

Each SDK already provides all required operations. An implementation should not
import generated stubs directly or build its own transport.

## How completed candles are handled

The newest historical or streamed candle is kept pending. Updates carrying the
same timestamp replace it. Only a bar with a later timestamp confirms that the
pending candle has closed, at which point it is passed to the MACD calculation.

Historical bars warm up the averages without placing orders.

## How the position is tracked

Because the exit rule is a condition rather than a crossover, the strategy has
to know whether it is holding. Every implementation keeps one in-memory flag:

- it starts flat on every run and never adopts a position it did not open;
- the flag follows what an acted-on signal implies: long after an entry, flat
  after an exit;
- an entry blocked by a safety guard is not adopted, so the strategy stays flat
  and remains free to act on the next signal;
- an exit blocked because the account holds nothing still clears the flag — the
  guard has just confirmed the strategy is flat, so an order that never filled
  cannot strand it;
- a dry run sets the flag too, which is what makes its log alternate between
  entry and exit instead of repeating exits on every declining candle.

The flag lives in memory. A restarted process is flat again, whatever the
account holds.

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
variables. The programs do not load `.env` automatically. To use a local file,
copy [`.env.example`](.env.example), edit it, and export its values in your shell
before starting an implementation:

```sh
cp .env.example .env
# Edit .env, then:
set -a
source .env
set +a
```

The repository ignores `.env`; never commit real secrets.

| Environment variable | Required | Default |
| --- | --- | --- |
| `TRADE_API_SECRET` | Yes, unless `--secret` is used | — |
| `TRADE_API_SYMBOL` | Yes, unless `--symbol` is used | — |
| `TRADE_API_TIMEFRAME` | No | `M5` |
| `TRADE_API_QUANTITY` | No | `1` |
| `TRADE_API_LOG_LEVEL` | No | `INFO` |

Symbols use `ticker@mic` format, for example `AAPL@XNAS`. Supported timeframes
are `M1`, `M5`, `M15`, `M30`, `H1`, `H2`, `H4`, `H8`, `D`, `W`, `MN`, and `QR`.
The MACD windows are part of the rule and are not configurable from the command
line. `evaluate` takes them as arguments, so a copy of the example can run other
settings by passing them at the call in `runner`:

```python
# Defined in python/strategy.py, called from python/runner.py.
evaluate(closes, in_position, fast_window=12, slow_window=26, signal_window=9)
```

```ts
// Defined in node/strategy.ts, called from node/runner.ts.
evaluate(closes, inPosition, /* fastWindow */ 12, /* slowWindow */ 26, /* signalWindow */ 9);
```

Both modules derive the warm-up from those windows, so a shorter or longer
setting changes how many candles the first signal needs; `required_closes` and
`requiredCloses` report the number.

## Read-only smoke test

Every implementation offers a check mode that authenticates, fetches historical
bars, calculates the latest confirmed MACD values, prints one line, and exits
without opening the live subscription, reading an account, or placing an order:

```text
History check passed: close=... macd=... macd_signal=... histogram=... signal=...
```

MACD values are rounded to six decimals for display only; the rule compares the
full values.

## What a dry run logs

Without `--check`, the strategy streams and logs one line per completed candle,
plus a warning whenever a signal fires. This excerpt is the MACD line crossing
zero and opening a position:

```text
History ready: close=108.38596018061494 macd=-0.824422 macd_signal=-1.716780
Closed bar: close=109.46749318524913 macd=-0.476849 macd_signal=-1.468793 histogram=0.991944 signal=none
Closed bar: close=110.34030597120521 macd=-0.129474 macd_signal=-1.200930 histogram=1.071456 signal=none
Closed bar: close=110.91996935976759 macd=0.190403 macd_signal=-0.922663 histogram=1.113066 signal=entry
DRY RUN: entry 2 units of AAPL@XNAS
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
application would replace with reconciled, persisted state.
