# Focused SDK examples

These standalone projects show one Trade API operation at a time. Their
committed manifests and lockfiles use published SDK packages, matching the
experience of an application outside this repository.

| Language | Package | Examples |
| --- | --- | --- |
| [Node.js](node/) | `@limeint/trade-api@2.18.1-rc.1` from npm | authentication, quotes, limit order |
| [Python](python/) | `limeint-sdk==2.18.1rc1` from TestPyPI | authentication, async quotes, limit order |

## Configure a secret

Either export `TRADE_API_SECRET` directly or prepare the shared gitignored
environment file from the repository root:

```sh
cp examples/sdk/.env.example examples/sdk/.env
# Edit examples/sdk/.env, then:
set -a
source examples/sdk/.env
set +a
```

Start with each language's bounded authentication example. Order examples are
separately guarded because they submit real orders.

## Contributor SDK override

Published packages remain the default. Contributors can temporarily replace
the installed packages with SDKs from the current checkout:

```sh
just examples-use-local
just examples-status
```

Use `just examples-use-published` to restore every locked published package.
With the secret exported, `just smoke-examples-local` or
`just smoke-examples-published` runs all bounded, read-only smoke checks in the
selected mode.
