# White-label Trade API

This repository is a vendor-neutral SDK and protocol template for a gRPC and
WebSocket trading API. It contains:

- protobuf contracts and an OpenAPI document;
- generated Go clients;
- Kotlin and JavaScript SDKs;
- an AsyncAPI WebSocket specification;
- example trading strategies.

The wire-level protobuf namespace remains `grpc.tradeapi.v1`. Keeping that
namespace stable allows an existing compatible backend to serve every branded
SDK without changing RPC method names.

## Configure your brand

The repository uses intentionally non-production placeholders. Replace these
values before publishing:

| Placeholder | Purpose |
| --- | --- |
| `Your Brand` / `YourBrand` / `yourbrand` | Display name and language namespace |
| `your-brand` | DNS and npm scope |
| `your-organization` | GitHub organization and Go module owner |
| `api.your-brand.example` | API hostname |
| `developer.your-brand.example` | Developer portal |

The `.example` top-level domain is reserved for documentation and cannot route
to a production service accidentally.

## Runtime configuration

Applications should receive deployment-specific values from their environment:

| Variable | Meaning |
| --- | --- |
| `TRADE_API_HOST` | API hostname used by the Kotlin SDK |
| `TRADE_API_ADDRESS` | Go gRPC address in `host:port` form |
| `TRADE_API_URL` | JavaScript gRPC-Web base URL |
| `TRADE_API_SECRET` | API secret used by examples |
| `TRADE_API_ACCOUNT_ID` | Trading account used by examples |

Do not commit production secrets or customer account IDs.

## Package coordinates

The template currently uses these neutral coordinates:

- Go: `github.com/your-organization/trade-api/go`
- Kotlin: `com.yourbrand.tradeapi:trade-api-kotlin`
- JavaScript: `@your-brand/grpc-tradeapi`
- Python examples: `limeint-sdk`, imported as `trade_api`

Package registry names are global. Confirm ownership of your Maven namespace,
npm scope, and Python distribution name before enabling the publish workflows.

## Generate and verify

From the repository root:

```sh
cd go && go test ./...
cd ../js && npm ci && npm run build
cd ../kotlin && ./gradlew build
```

The Go generation workflow rebuilds the checked-in Go clients and Swagger
document whenever protobuf contracts change. Generated files should not be
edited by hand.
