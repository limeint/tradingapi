set shell := ["zsh", "-cu"]

# Every recipe below loads the repository-root .env, so a single file supplies
# TRADE_API_SECRET and the shared example settings. Copy .env.example to .env to
# create it. Variables already exported in the shell take precedence.
set dotenv-load := true
set dotenv-path := "."

default: check

# Install every development dependency from its lockfile.
bootstrap:
    npm --prefix sdk/node ci
    npm --prefix examples/sdk/node ci
    npm --prefix examples/strategies/sma_crossover/node ci
    npm --prefix examples/strategies/macd_zero_cross/node ci
    npm --prefix examples/strategies/rsi_threshold/node ci
    cd sdk/python && uv sync --locked
    cd examples/sdk/python && uv sync --locked
    cd examples/strategies/sma_crossover/python && uv sync --locked
    cd examples/strategies/macd_zero_cross/python && uv sync --locked
    cd examples/strategies/rsi_threshold/python && uv sync --locked
    uv tool install pre-commit
    pre-commit install
    just generate

# Rebuild language bindings from the source proto files.
generate:
    npm --prefix sdk/node run generate
    cd sdk/python && uv run ./scripts/generate_proto.sh

# Apply deterministic formatting and safe lint fixes.
format:
    npm --prefix sdk/node run format
    npm --prefix examples/sdk/node run format
    npm --prefix examples/strategies/sma_crossover/node run format
    npm --prefix examples/strategies/macd_zero_cross/node run format
    npm --prefix examples/strategies/rsi_threshold/node run format
    cd sdk/python && uv run ruff check --fix trade_api tests
    cd sdk/python && uv run ruff format trade_api tests
    cd examples/sdk/python && uv run --no-sync ruff check --fix .
    cd examples/sdk/python && uv run --no-sync ruff format .
    cd examples/strategies/sma_crossover/python && uv run --no-sync ruff check --fix .
    cd examples/strategies/sma_crossover/python && uv run --no-sync ruff format .
    cd examples/strategies/macd_zero_cross/python && uv run --no-sync ruff check --fix .
    cd examples/strategies/rsi_threshold/python && uv run --no-sync ruff check --fix .
    cd examples/strategies/macd_zero_cross/python && uv run --no-sync ruff format .
    cd examples/strategies/rsi_threshold/python && uv run --no-sync ruff format .

# Fast static checks; these never modify files.
lint:
    npm --prefix sdk/node run lint
    npm --prefix examples/sdk/node run lint
    npm --prefix examples/strategies/sma_crossover/node run lint
    npm --prefix examples/strategies/macd_zero_cross/node run lint
    npm --prefix examples/strategies/rsi_threshold/node run lint
    cd sdk/python && uv run ruff check trade_api tests
    cd sdk/python && uv run ruff format --check trade_api tests
    cd examples/sdk/python && uv run --no-sync ruff check .
    cd examples/sdk/python && uv run --no-sync ruff format --check .
    cd examples/strategies/sma_crossover/python && uv run --no-sync ruff check .
    cd examples/strategies/sma_crossover/python && uv run --no-sync ruff format --check .
    cd examples/strategies/macd_zero_cross/python && uv run --no-sync ruff check .
    cd examples/strategies/rsi_threshold/python && uv run --no-sync ruff check .
    cd examples/strategies/macd_zero_cross/python && uv run --no-sync ruff format --check .
    cd examples/strategies/rsi_threshold/python && uv run --no-sync ruff format --check .

typecheck: generate
    npm --prefix sdk/node run typecheck
    npm --prefix examples/sdk/node run typecheck
    npm --prefix examples/strategies/sma_crossover/node run typecheck
    npm --prefix examples/strategies/macd_zero_cross/node run typecheck
    npm --prefix examples/strategies/rsi_threshold/node run typecheck
    cd sdk/python && uv run mypy trade_api
    cd examples/sdk/python && uv run --no-sync mypy .
    cd examples/strategies/sma_crossover/python && uv run --no-sync mypy .
    cd examples/strategies/macd_zero_cross/python && uv run --no-sync mypy .
    cd examples/strategies/rsi_threshold/python && uv run --no-sync mypy .

test: generate
    npm --prefix sdk/node test
    npm --prefix examples/strategies/sma_crossover/node test
    npm --prefix examples/strategies/macd_zero_cross/node test
    npm --prefix examples/strategies/rsi_threshold/node test
    cd sdk/python && uv run pytest
    cd examples/strategies/sma_crossover/python && uv run --no-sync pytest
    cd examples/strategies/macd_zero_cross/python && uv run --no-sync pytest
    cd examples/strategies/rsi_threshold/python && uv run --no-sync pytest

check: lint typecheck test

# Replace published SDK dependencies in every standalone consumer example with
# SDKs from this checkout. Manifests and lockfiles remain unchanged.
examples-use-local-node:
    npm --prefix sdk/node run build
    cd examples/sdk/node && npm install --no-save ../../../sdk/node
    cd examples/strategies/sma_crossover/node && npm install --no-save ../../../../sdk/node
    cd examples/strategies/macd_zero_cross/node && npm install --no-save ../../../../sdk/node
    cd examples/strategies/rsi_threshold/node && npm install --no-save ../../../../sdk/node

examples-use-local-python:
    cd sdk/python && uv sync --locked
    cd sdk/python && uv run ./scripts/generate_proto.sh
    cd examples/sdk/python && uv sync --locked
    cd examples/sdk/python && uv pip install --python .venv/bin/python --editable ../../../sdk/python
    cd examples/strategies/sma_crossover/python && uv sync --locked
    cd examples/strategies/sma_crossover/python && uv pip install --python .venv/bin/python --editable ../../../../sdk/python
    cd examples/strategies/macd_zero_cross/python && uv sync --locked
    cd examples/strategies/rsi_threshold/python && uv sync --locked
    cd examples/strategies/macd_zero_cross/python && uv pip install --python .venv/bin/python --editable ../../../../sdk/python
    cd examples/strategies/rsi_threshold/python && uv pip install --python .venv/bin/python --editable ../../../../sdk/python

examples-use-local: examples-use-local-node examples-use-local-python

# Rebuild the linked Node.js SDK as source files change. Run this in a second
# terminal after examples-use-local-node for iterative debugging.
watch-node-sdk:
    npm --prefix sdk/node run dev

# Restore every standalone example to its committed published dependency.
examples-use-published-node:
    npm --prefix examples/sdk/node ci
    npm --prefix examples/strategies/sma_crossover/node ci
    npm --prefix examples/strategies/macd_zero_cross/node ci
    npm --prefix examples/strategies/rsi_threshold/node ci

examples-use-published-python:
    cd examples/sdk/python && uv sync --locked
    cd examples/strategies/sma_crossover/python && uv sync --locked
    cd examples/strategies/macd_zero_cross/python && uv sync --locked
    cd examples/strategies/rsi_threshold/python && uv sync --locked

examples-use-published: examples-use-published-node examples-use-published-python

# Show the real import locations, which distinguishes a registry install from
# a local link even when both packages have the same version.
examples-status:
    cd examples/sdk/node && node --input-type=module --eval 'import { realpathSync } from "node:fs"; import { fileURLToPath } from "node:url"; console.log("Node SDK example:", realpathSync(fileURLToPath(import.meta.resolve("@limeint/trade-api"))))'
    cd examples/strategies/sma_crossover/node && node --input-type=module --eval 'import { realpathSync } from "node:fs"; import { fileURLToPath } from "node:url"; console.log("Node SMA strategy:", realpathSync(fileURLToPath(import.meta.resolve("@limeint/trade-api"))))'
    cd examples/strategies/macd_zero_cross/node && node --input-type=module --eval 'import { realpathSync } from "node:fs"; import { fileURLToPath } from "node:url"; console.log("Node MACD strategy:", realpathSync(fileURLToPath(import.meta.resolve("@limeint/trade-api"))))'
    cd examples/strategies/rsi_threshold/node && node --input-type=module --eval 'import { realpathSync } from "node:fs"; import { fileURLToPath } from "node:url"; console.log("Node RSI strategy:", realpathSync(fileURLToPath(import.meta.resolve("@limeint/trade-api"))))'
    uv run --project examples/sdk/python --no-sync python -c 'import trade_api; print("Python SDK example:", trade_api.__file__)'
    uv run --project examples/strategies/sma_crossover/python --no-sync python -c 'import trade_api; print("Python SMA strategy:", trade_api.__file__)'
    uv run --project examples/strategies/macd_zero_cross/python --no-sync python -c 'import trade_api; print("Python MACD strategy:", trade_api.__file__)'
    uv run --project examples/strategies/rsi_threshold/python --no-sync python -c 'import trade_api; print("Python RSI strategy:", trade_api.__file__)'

# Show the shared settings the root .env supplies. The secret is masked.
env-status:
    for name in TRADE_API_SECRET TRADE_API_SYMBOL TRADE_API_TIMEFRAME TRADE_API_QUANTITY TRADE_API_LOG_LEVEL TRADE_API_LIMIT_PRICE TRADE_API_EXECUTE; do value="${(P)name:-}"; if [ -z "$value" ]; then printf '%-22s unset\n' "$name"; elif [ "$name" = TRADE_API_SECRET ]; then printf '%-22s set (%d characters)\n' "$name" "${#value}"; else printf '%-22s %s\n' "$name" "$value"; fi; done

# Run a strategy implementation with the settings from the root .env. STRATEGY
# is sma_crossover, macd_zero_cross, or rsi_threshold, and trailing arguments
# reach the program. Dry-run is the default; --check is bounded and read-only.
#   just run-strategy-python sma_crossover --check
run-strategy-python strategy *args:
    uv run --project examples/strategies/{{strategy}}/python --no-sync python examples/strategies/{{strategy}}/python/main.py {{args}}

# Node.js twin of run-strategy-python.
#   just run-strategy-node sma_crossover --check
run-strategy-node strategy *args:
    npm --prefix examples/strategies/{{strategy}}/node start -- {{args}}

# Run a focused SDK example with the settings from the root .env. SCRIPT is a
# file name under examples/sdk/python/.
#   just run-sdk-python auth_and_account.py
run-sdk-python script *args:
    uv run --project examples/sdk/python --no-sync python examples/sdk/python/{{script}} {{args}}

# Node.js twin of run-sdk-python. SCRIPT is a package script: auth, quotes, or
# order.
#   just run-sdk-node auth
run-sdk-node script *args:
    npm --prefix examples/sdk/node run {{script}} -- {{args}}

# Bounded, read-only live checks using whichever SDK mode is currently active.
smoke-node-examples:
    npm --prefix examples/sdk/node run smoke
    npm --prefix examples/strategies/sma_crossover/node start -- --symbol "${TRADE_API_SYMBOL:-AAPL@XNGS}" --check
    npm --prefix examples/strategies/macd_zero_cross/node start -- --symbol "${TRADE_API_SYMBOL:-AAPL@XNGS}" --check
    npm --prefix examples/strategies/rsi_threshold/node start -- --symbol "${TRADE_API_SYMBOL:-AAPL@XNGS}" --check

smoke-python-examples:
    uv run --project examples/sdk/python --no-sync python examples/sdk/python/auth_and_account.py
    uv run --project examples/strategies/sma_crossover/python --no-sync python examples/strategies/sma_crossover/python/main.py --symbol "${TRADE_API_SYMBOL:-AAPL@XNGS}" --check
    uv run --project examples/strategies/macd_zero_cross/python --no-sync python examples/strategies/macd_zero_cross/python/main.py --symbol "${TRADE_API_SYMBOL:-AAPL@XNGS}" --check
    uv run --project examples/strategies/rsi_threshold/python --no-sync python examples/strategies/rsi_threshold/python/main.py --symbol "${TRADE_API_SYMBOL:-AAPL@XNGS}" --check

smoke-examples: smoke-node-examples smoke-python-examples

smoke-examples-local: examples-use-local smoke-examples

smoke-examples-published: examples-use-published smoke-examples
