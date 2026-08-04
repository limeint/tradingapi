# Limeint strategy examples

Runnable trading strategies built with the published Trade API SDKs. The
examples favor readable code, safe defaults, and explicit API calls so
developers can copy the patterns — or the directories themselves — into their
own applications.

## Run your first strategy check

Choose either implementation. Both commands are bounded and read-only: they
authenticate, fetch historical candles, calculate the latest signal, and exit.

```sh
# Python 3.10+ and uv
cd examples/strategies/sma_crossover/python
uv sync --locked
TRADE_API_SECRET=... uv run python main.py --symbol AAPL@XNAS --check
```

```sh
# Node.js 20+
cd examples/strategies/sma_crossover/node
npm ci
TRADE_API_SECRET=... npm start -- --symbol AAPL@XNAS --check
```

Run these from the repository root. Continue with the
[SMA strategy guide](sma_crossover/) before opening a live stream or enabling
execution.

## Available strategies

| Strategy | Rule | Languages |
| --- | --- | --- |
| [SMA 9/30 crossover](sma_crossover/README.md) | Enter when SMA 9 crosses above SMA 30; exit on the reverse crossover | [Python](sma_crossover/python/), [Node.js](sma_crossover/node/) |

## Layout and authoring conventions

Each strategy owns a directory, and each language implementation lives inside
it:

```text
examples/
  strategies/
    <strategy>/
      README.md          # the rule, candle handling, safety guards, configuration
      .env.example       # settings shared by every implementation
      python/            # self-contained implementation + its own README
      node/              # self-contained implementation + its own README
```

Implementations stay flat inside their language directory — source files at the
top level, no package scaffolding wrapping them. There is one program per
directory, so the extra nesting would only repeat the strategy name.

The strategy README is language-neutral and is the single source of truth for
behavior. Language directories document only installation, running, and tests
for that ecosystem.

## Conventions

Every implementation added here should:

- depend on the **published** SDK for its language, never on the source tree in
  this repository — the example code then matches what a user of the package
  writes, and the directory stays runnable once copied out;
- be self-contained: its own dependency manifest and tool configuration, so no
  file outside the directory is needed to run it;
- keep signal calculation separate from API and order code;
- evaluate completed candles rather than changing candles;
- start in dry-run mode, and require an explicit flag before placing orders;
- honor the safety guards described in the strategy README;
- use the environment variables documented by the strategy;
- include focused unit tests that need no credentials or network access.

These examples are learning material, not a production trading system.
Applications derived from them still need persistent state, monitoring, risk
limits, reconciliation, and operational controls appropriate to their use case.
