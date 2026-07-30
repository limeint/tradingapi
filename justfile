set shell := ["zsh", "-cu"]

default: check

# Install every development dependency from its lockfile.
bootstrap:
    npm --prefix sdk/node ci
    npm --prefix strategies/sma_crossover/node ci
    cd sdk/python && uv sync --locked
    cd strategies/sma_crossover/python && uv sync --locked
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
    npm --prefix strategies/sma_crossover/node run format
    cd sdk/python && uv run ruff check --fix trade_api examples tests
    cd sdk/python && uv run ruff format trade_api examples tests
    cd strategies/sma_crossover/python && uv run ruff check --fix .
    cd strategies/sma_crossover/python && uv run ruff format .

# Fast static checks; these never modify files.
lint:
    npm --prefix sdk/node run lint
    npm --prefix strategies/sma_crossover/node run lint
    cd sdk/python && uv run ruff check trade_api examples tests
    cd sdk/python && uv run ruff format --check trade_api examples tests
    cd strategies/sma_crossover/python && uv run ruff check .
    cd strategies/sma_crossover/python && uv run ruff format --check .

typecheck: generate
    npm --prefix sdk/node run typecheck
    npm --prefix strategies/sma_crossover/node run typecheck
    cd sdk/python && uv run mypy trade_api examples
    cd strategies/sma_crossover/python && uv run mypy .

test: generate
    npm --prefix sdk/node test
    npm --prefix strategies/sma_crossover/node test
    cd sdk/python && uv run pytest
    cd strategies/sma_crossover/python && uv run pytest

check: lint typecheck test
