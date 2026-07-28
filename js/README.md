# Trade API Client for JavaScript

White-label Trade API client generated from the `.proto` contracts with
[Buf](https://buf.build). Replace the `your-brand` scope with your
organization's npm scope before publishing.

## Installation

```sh
npm install @your-brand/grpc-tradeapi @connectrpc/connect @connectrpc/connect-web
```

## Quick Start

```javascript
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { createClient } from '@connectrpc/connect';
import { AuthService } from '@your-brand/grpc-tradeapi/grpc/tradeapi/v1/auth/auth_service_pb';
import { AccountsService } from '@your-brand/grpc-tradeapi/grpc/tradeapi/v1/accounts/accounts_service_pb';

const transport = createGrpcWebTransport({
  baseUrl: process.env.TRADE_API_URL ?? 'https://api.your-brand.example',
});

// Create the authentication client.
const authClient = createClient(AuthService, transport);

// Exchange the API secret for an access token.
const authResponse = await authClient.auth({ secret: 'YOUR_TOKEN' });
const token = authResponse.token;

// Include the token in subsequent requests.
const headers = { authorization: token };

// Create and use another service client.
const accountsClient = createClient(AccountsService, transport);
const accountResponse = await accountsClient.getAccount(
  { accountId: 'A12345' },
  { headers },
);

console.log(accountResponse);
```

Import and use other services from `@your-brand/grpc-tradeapi` in the same way.
