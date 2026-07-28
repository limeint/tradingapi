# Trade API Client for Go

White-label Trade API client code generated from the `.proto` contracts.
Replace `your-organization` with your brand's GitHub organization before publishing.

## Installation

Install the latest version:

```sh
go get github.com/your-organization/trade-api/go@latest
```

## Quick Start

The following example connects to the gRPC endpoint and invokes a generated
client method. Refer to the imported packages for the complete method and
message definitions.

```go
package main

import (
	"context"
	"crypto/tls"
	"log"
	"os"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/metadata"

	"github.com/your-organization/trade-api/go/grpc/tradeapi/v1/accounts"
	"github.com/your-organization/trade-api/go/grpc/tradeapi/v1/auth"
)

func main() {
	ctx := context.Background()

	// Your brand's gRPC server address, for example api.your-brand.example:443.
	grpcAddr := os.Getenv("TRADE_API_ADDRESS")
	if grpcAddr == "" {
		log.Fatal("TRADE_API_ADDRESS is required")
	}
	tlsConfig := tls.Config{MinVersion: tls.VersionTLS12}

	// Create the connection.
	conn, err := grpc.NewClient(
		grpcAddr,
		grpc.WithTransportCredentials(credentials.NewTLS(&tlsConfig)),
	)
	if err != nil {
		log.Fatalf("dial failed: %v", err)
	}
	defer conn.Close()

	// Exchange the API secret for an access token.
	secretToken := "YOUR_TOKEN"
	authService := auth.NewAuthServiceClient(conn)
	respAuth, err := authService.Auth(ctx, &auth.AuthRequest{Secret: secretToken})
	if err != nil {
		log.Fatalf("auth failed: %v", err)
	}
	token := respAuth.GetToken()

	// Add authorization metadata to subsequent requests.
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	ctx = metadata.AppendToOutgoingContext(ctx, "Authorization", token)

	// Create the required service client.
	accountsClient := accounts.NewAccountsServiceClient(conn)

	// Invoke a method with your account data.
	req := &accounts.GetAccountRequest{AccountId: "A12345"}
	resp, err := accountsClient.GetAccount(ctx, req)
	if err != nil {
		log.Fatalf("GetAccount error: %v", err)
	}
	log.Printf("Account: %+v", resp)
}
```

Use the other services in the same way by importing their packages from
`grpc/tradeapi/v1`.

## Local Generation

Use the following steps to regenerate the Go client and OpenAPI document from
the `.proto` contracts.

### 1. Prepare the environment

- Install Go and configure your environment using the [Go Wiki](https://go.dev/wiki/#getting-started-with-go).
- Install `protoc` using the [Protocol Buffer compiler installation guide](https://grpc.io/docs/protoc-installation).
- Add `$GOBIN` (`%GOBIN%` on Windows) to `PATH`. If `GOBIN` is not set, also add `$(go env GOPATH)/bin`.

### 2. Install generators

The project declares code-generation tools in `go.mod`. Install them with:

```sh
go install tool
```

This installs:

- `protoc-gen-grpc-gateway`
- `protoc-gen-openapiv2`
- `protoc-gen-go`
- `protoc-gen-go-grpc`

Confirm that the tools are available, for example by running
`protoc-gen-go --version` and `protoc --version`.

### 3. Generate code and the specification

Run this command from the repository root:

```sh
protoc \
  --proto_path=proto \
  --go_out=go --go_opt=paths=source_relative \
  --go-grpc_out=go --go-grpc_opt=paths=source_relative \
  --openapiv2_out=docs/swagger \
  --openapiv2_opt=logtostderr=true,allow_merge=true,merge_file_name=api,json_names_for_fields=false \
  ./proto/grpc/tradeapi/v1/*.proto \
  ./proto/grpc/tradeapi/v1/accounts/*.proto \
  ./proto/grpc/tradeapi/v1/assets/*.proto \
  ./proto/grpc/tradeapi/v1/auth/*.proto \
  ./proto/grpc/tradeapi/v1/marketdata/*.proto \
  ./proto/grpc/tradeapi/v1/metrics/*.proto \
  ./proto/grpc/tradeapi/v1/orders/*.proto \
  ./proto/grpc/tradeapi/v1/reports/*.proto
```

The command:

- writes Go code to `go/grpc/tradeapi/v1/...`;
- updates `docs/swagger/api.swagger.json`.

## Automatic Generation

When protobuf contracts change on `main`, the Go generation workflow rebuilds
the generated client and Swagger document automatically.
