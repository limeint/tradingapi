# Limeint Trade API

This repository contains Limeint's Python SDK, protocol definitions, and
example trading strategies for the gRPC Trade API:

- protobuf contracts used to generate the Python client;
- the publishable `limeint-sdk` Python package;
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
```

Python CI regenerates the protobuf client, tests the SDK, builds its wheel and
source archive, and runs the strategy against the installed wheel.
