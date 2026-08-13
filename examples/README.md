# Limeint Trade API examples

Start with a complete strategy if you want to see authentication, historical
market data, streaming, signal calculation, account discovery, and guarded order
placement working together.

## Fastest safe example

From the repository root, the SMA history check makes read-only API calls and
exits after one result:

```sh
cd examples/strategies/sma_crossover/python
uv sync --locked
TRADE_API_SECRET=... uv run python main.py --symbol AAPL@XNAS --check
```

Node.js users can run the equivalent implementation:

```sh
cd examples/strategies/sma_crossover/node
npm ci
TRADE_API_SECRET=... npm start -- --symbol AAPL@XNAS --check
```

The same command works in `examples/strategies/macd_zero_cross/` and
`examples/strategies/rsi_threshold/`, the other two strategies in this
repository. See [Trading strategies](strategies/) for what each rule does and the
shared safety conventions.

## Focused SDK examples

Use the smaller standalone projects when you want one operation at a time:

- [Python SDK examples](sdk/python/) — authentication and account
  discovery, async quotes, and a limit-order example.
- [Node.js SDK examples](sdk/node/) — authentication and account
  discovery, quotes, and a limit-order example.

Each project pins and installs a published SDK exactly as a separate consuming
application would. Contributors can temporarily replace those installations
with the SDKs from this checkout through the root `just` commands documented in
[Repository development](../README.md#repository-development).

Order examples send real requests. Read their warnings and use a dedicated test
account; the strategy history check above is the recommended first run.
