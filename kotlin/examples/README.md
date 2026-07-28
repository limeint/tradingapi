# Trade API Kotlin Examples

## Overview

This module contains Kotlin examples for the white-label Trade API.

## Obtain an API Secret

The examples require an API secret for authentication.

1. Open your brand's developer portal and go to API key management.
2. Follow the instructions to create a new secret.
3. Copy the secret and provide it through the environment as shown below.

## Account Example

### `GetAccount`

This example:

1. exchanges the API secret for a JWT access token;
2. uses the token to request account information;
3. prints the response.

### Run

Select the example through `APP_MAIN_CLASS` and provide the API host and secret.

**macOS/Linux:**

```bash
export TRADE_API_SECRET="your-secret-key"
export TRADE_API_HOST="api.your-brand.example"
export APP_MAIN_CLASS=example.GetAccount
./gradlew :examples:run
```

**Windows Command Prompt:**

```cmd
set TRADE_API_SECRET="your-secret-key"
set TRADE_API_HOST="api.your-brand.example"
set APP_MAIN_CLASS="example.GetAccount"
gradlew.bat :examples:run
```

**Windows PowerShell:**

```powershell
$env:TRADE_API_SECRET="your-secret-key"
$env:TRADE_API_HOST="api.your-brand.example"
$env:APP_MAIN_CLASS="example.GetAccount"
./gradlew :examples:run
```

Replace `your-secret-key` with a valid API secret.

## WebSocket Examples

WebSocket subscription examples are under `example.ws`:

- [SubscribeBars.kt](src/main/kotlin/example/ws/SubscribeBars.kt) — aggregated bars
- [SubscribeLatestTrades.kt](src/main/kotlin/example/ws/SubscribeLatestTrades.kt) — instrument trades
- [SubscribeOrderBook.kt](src/main/kotlin/example/ws/SubscribeOrderBook.kt) — order book updates
- [SubscribeQuotes.kt](src/main/kotlin/example/ws/SubscribeQuotes.kt) — instrument quotes
- [SubscribeOrders.kt](src/main/kotlin/example/ws/SubscribeOrders.kt) — account orders
- [SubscribeTrades.kt](src/main/kotlin/example/ws/SubscribeTrades.kt) — account trades
- [SubscribeAccount.kt](src/main/kotlin/example/ws/SubscribeAccount.kt) — account updates
- [SubscribeBarsWithoutAuthorizationHeader.kt](src/main/kotlin/example/ws/SubscribeBarsWithoutAuthorizationHeader.kt) — token sent in the subscription payload instead of the Authorization header

Each example:

1. exchanges `TRADE_API_SECRET` for a JWT;
2. opens a WebSocket connection;
3. waits for the handshake;
4. creates a subscription;
5. logs received data;
6. cancels the subscription;
7. closes the connection.

### Run from IntelliJ IDEA

1. Select an example class such as [SubscribeBars.kt](src/main/kotlin/example/ws/SubscribeBars.kt).
2. Open **Modify run configuration**.
3. Add `TRADE_API_SECRET="your-secret-key"` and `TRADE_API_HOST="api.your-brand.example"` to the environment variables.
4. Run `main`.

### Run from a Terminal

```bash
export TRADE_API_SECRET="your-secret-key"
export TRADE_API_HOST="api.your-brand.example"
export APP_MAIN_CLASS="example.ws.SubscribeBars"
./gradlew :examples:run
```
