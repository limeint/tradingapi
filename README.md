# Limeint Trade API

This repository contains Limeint's Python and Node.js SDKs, protocol
definitions, and example trading strategies for the gRPC Trade API:

- protobuf contracts used to generate both clients;
- the publishable Python and Node.js packages;
- example trading strategies.

The wire-level protobuf namespace remains `grpc.tradeapi.v1`. Keeping that
namespace stable preserves compatibility with the existing API backend and RPC
method names.

## Runtime configuration

Applications should receive deployment-specific values from their environment:

| Variable | Meaning |
| --- | --- |
| `TRADE_API_SECRET` | API secret used by the SDK and strategies |
| `TRADE_API_ACCOUNT_ID` | Trading account used by strategies |
| `TRADE_API_SYMBOL` | Strategy instrument in `ticker@mic` form |
| `TRADE_API_TIMEFRAME` | Strategy candle timeframe |

Do not commit production secrets or customer account IDs.

## Package coordinates

- Python: `limeint-sdk`, imported as `trade_api`
- Node.js: `@limeint/trade-api`

Both packages share a version. Publishing one GitHub Release with a bare
version tag such as `2.18.1` publishes Python to PyPI and Node.js to npm.
Maintainers should follow [the SDK release guide](sdk/node/RELEASING.md).

The repository and issue tracker are at
<https://github.com/limeint/tradingapi>.

## Generate and verify

From the repository root:

```sh
cd sdk/python
python -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]" build
./scripts/generate_proto.sh
python -m pytest
python -m build

cd ../../strategies/sma_crossover/python
python -m venv .venv
source .venv/bin/activate
python -m pip install ../../../sdk/python/dist/*.whl
python -m pip install -r requirements-dev.txt
python -m pytest

cd ../../../sdk/node
npm ci
npm run generate
npm run typecheck
npm test
npm run build
npm pack --dry-run

cd ../../strategies/sma_crossover/node
npm ci
npm run typecheck
npm test
```

CI regenerates and verifies both protobuf clients. Python CI builds its wheel
and source archive and runs the example strategy against the installed wheel;
Node CI type-checks, tests, builds, and verifies the npm package contents. The
published-strategy workflow separately installs the exact public Python and
Node.js releases and tests both language implementations as external consumers.
