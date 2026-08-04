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

See [Trading strategies](strategies/) for the available strategies and shared
safety conventions.

## SDK-sized examples

Use the smaller examples when you want one operation at a time:

- [Python SDK examples](../sdk/python/examples/) — authentication and account
  discovery, async quotes, and a limit-order example.
- [Node.js SDK examples](../sdk/node/examples/) — authentication and account
  discovery, quotes, and a limit-order example.

Order examples send real requests. Read their warnings and use a dedicated test
account; the strategy history check above is the recommended first run.
