# Limeint Trade API

This repository contains Limeint's Python and Node.js SDKs, protocol
definitions, and example trading strategies for the gRPC Trade API:

- protobuf contracts used to generate both clients;
- the publishable Python and Node.js packages;
- [example trading strategies](examples/strategies/).

The wire-level protobuf namespace remains `grpc.tradeapi.v1`. Keeping that
namespace stable preserves compatibility with the existing API backend and RPC
method names.

## Runtime configuration

Applications should receive deployment-specific values from their environment:

| Variable | Meaning |
| --- | --- |
| `TRADE_API_SECRET` | API secret used by the SDK and strategies |
| `TRADE_API_SYMBOL` | Strategy instrument in `ticker@mic` form |
| `TRADE_API_TIMEFRAME` | Strategy candle timeframe |

Trading account IDs are discovered from `AuthService.TokenDetails` after
authentication. Do not commit production secrets or customer account IDs.

## Package coordinates

- Python: `limeint-sdk`, imported as `trade_api`
- Node.js: `@limeint/trade-api`

Both packages share a version. Publishing one GitHub Release with a bare
version tag such as `2.18.1` publishes Python to PyPI and Node.js to npm.
Maintainers should follow [the SDK release guide](sdk/node/RELEASING.md).

The repository and issue tracker are at
<https://github.com/limeint/tradingapi>.

## Development

From the repository root:

```sh
just bootstrap
just format
just check
```

`just` is the single command surface. Biome formats and lints TypeScript; Ruff
does the same for Python; TypeScript and mypy enforce types; pre-commit runs the
fast checks before every commit. Python dependencies are locked by `uv`, and npm
lockfiles cover Node.js.

Generated protobuf bindings are build artifacts. `just generate` recreates
them from `proto/`; they are excluded from review so changes stay focused on
the source contracts and handwritten SDK code.
