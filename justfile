set shell := ["zsh", "-cu"]

default: check

# Install every development dependency from its lockfile.
bootstrap:
    npm --prefix sdk/node ci
    npm --prefix examples/sdk/node ci
    npm --prefix examples/strategies/sma_crossover/node ci
    cd sdk/python && uv sync --locked
    cd examples/sdk/python && uv sync --locked
    cd examples/strategies/sma_crossover/python && uv sync --locked
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
    cd sdk/python && uv run ruff check --fix trade_api tests
    cd sdk/python && uv run ruff format trade_api tests
    cd examples/sdk/python && uv run --no-sync ruff check --fix .
    cd examples/sdk/python && uv run --no-sync ruff format .
    cd examples/strategies/sma_crossover/python && uv run --no-sync ruff check --fix .
    cd examples/strategies/sma_crossover/python && uv run --no-sync ruff format .

# Fast static checks; these never modify files.
lint:
    npm --prefix sdk/node run lint
    npm --prefix examples/sdk/node run lint
    npm --prefix examples/strategies/sma_crossover/node run lint
    cd sdk/python && uv run ruff check trade_api tests
    cd sdk/python && uv run ruff format --check trade_api tests
    cd examples/sdk/python && uv run --no-sync ruff check .
    cd examples/sdk/python && uv run --no-sync ruff format --check .
    cd examples/strategies/sma_crossover/python && uv run --no-sync ruff check .
    cd examples/strategies/sma_crossover/python && uv run --no-sync ruff format --check .

typecheck: generate
    npm --prefix sdk/node run typecheck
    npm --prefix examples/sdk/node run typecheck
    npm --prefix examples/strategies/sma_crossover/node run typecheck
    cd sdk/python && uv run mypy trade_api
    cd examples/sdk/python && uv run --no-sync mypy .
    cd examples/strategies/sma_crossover/python && uv run --no-sync mypy .

test: generate
    npm --prefix sdk/node test
    npm --prefix examples/strategies/sma_crossover/node test
    cd sdk/python && uv run pytest
    cd examples/strategies/sma_crossover/python && uv run --no-sync pytest

check: lint typecheck test

# Replace published SDK dependencies in every standalone consumer example with
# SDKs from this checkout. Manifests and lockfiles remain unchanged.
examples-use-local-node:
    npm --prefix sdk/node run build
    cd examples/sdk/node && npm install --no-save ../../../sdk/node
    cd examples/strategies/sma_crossover/node && npm install --no-save ../../../../sdk/node

examples-use-local-python:
    cd sdk/python && uv sync --locked
    cd sdk/python && uv run ./scripts/generate_proto.sh
    cd examples/sdk/python && uv sync --locked
    cd examples/sdk/python && uv pip install --python .venv/bin/python --editable ../../../sdk/python
    cd examples/strategies/sma_crossover/python && uv sync --locked
    cd examples/strategies/sma_crossover/python && uv pip install --python .venv/bin/python --editable ../../../../sdk/python

examples-use-local: examples-use-local-node examples-use-local-python

# Rebuild the linked Node.js SDK as source files change. Run this in a second
# terminal after examples-use-local-node for iterative debugging.
watch-node-sdk:
    npm --prefix sdk/node run dev

# Restore every standalone example to its committed published dependency.
examples-use-published-node:
    npm --prefix examples/sdk/node ci
    npm --prefix examples/strategies/sma_crossover/node ci

examples-use-published-python:
    cd examples/sdk/python && uv sync --locked
    cd examples/strategies/sma_crossover/python && uv sync --locked

examples-use-published: examples-use-published-node examples-use-published-python

# Show the real import locations, which distinguishes a registry install from
# a local link even when both packages have the same version.
examples-status:
    cd examples/sdk/node && node --input-type=module --eval 'import { realpathSync } from "node:fs"; import { fileURLToPath } from "node:url"; console.log("Node SDK example:", realpathSync(fileURLToPath(import.meta.resolve("@limeint/trade-api"))))'
    cd examples/strategies/sma_crossover/node && node --input-type=module --eval 'import { realpathSync } from "node:fs"; import { fileURLToPath } from "node:url"; console.log("Node strategy:", realpathSync(fileURLToPath(import.meta.resolve("@limeint/trade-api"))))'
    uv run --project examples/sdk/python --no-sync python -c 'import trade_api; print("Python SDK example:", trade_api.__file__)'
    uv run --project examples/strategies/sma_crossover/python --no-sync python -c 'import trade_api; print("Python strategy:", trade_api.__file__)'

# Bounded, read-only live checks using whichever SDK mode is currently active.
smoke-node-examples:
    npm --prefix examples/sdk/node run smoke
    npm --prefix examples/strategies/sma_crossover/node start -- --symbol "${TRADE_API_SYMBOL:-AAPL@XNAS}" --check

smoke-python-examples:
    uv run --project examples/sdk/python --no-sync python examples/sdk/python/auth_and_account.py
    uv run --project examples/strategies/sma_crossover/python --no-sync python examples/strategies/sma_crossover/python/main.py --symbol "${TRADE_API_SYMBOL:-AAPL@XNAS}" --check

smoke-examples: smoke-node-examples smoke-python-examples

smoke-examples-local: examples-use-local smoke-examples

smoke-examples-published: examples-use-published smoke-examples
