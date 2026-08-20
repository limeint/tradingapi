# Focused SDK examples

These standalone projects show one Trade API operation at a time. Their
committed manifests and lockfiles use published SDK packages, matching the
experience of an application outside this repository.

| Language | Package | Examples |
| --- | --- | --- |
| [Node.js](node/) | `@limeint/trade-api@2.19.1` from npm | authentication, quotes, limit order |
| [Python](python/) | `limeint-sdk==2.19.1` from PyPI | authentication, async quotes, limit order |

## Configure a secret

One gitignored file at the repository root holds `TRADE_API_SECRET` and the
other shared settings, and every `just` recipe loads it:

```sh
# From the repository root
cp .env.example .env
# Edit .env, then:
just env-status
just run-sdk-python auth_and_account.py
just run-sdk-node auth
```

The examples themselves never read `.env`. To run one directly from its own
directory instead, export `TRADE_API_SECRET` in your shell first.

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
