"""Smoke tests for the per-service shim modules.

Each ``trade_api.<service>`` module re-exports proto message types so
callers can write ``from trade_api.assets import GetAssetRequest`` without
reaching into the generated ``trade_api.proto.*`` tree. These modules
contain no logic, but they are part of the public API surface: if a proto
regeneration renames or drops a message, the corresponding name in ``__all__``
stops resolving and these imports break. This test guards that contract by
importing each shim and asserting every advertised name is actually present.
"""

from __future__ import annotations

import importlib

import pytest

SHIM_MODULES = [
    "trade_api.accounts",
    "trade_api.assets",
    "trade_api.auth_messages",
    "trade_api.market_data",
    "trade_api.orders",
    "trade_api.reports",
    "trade_api.metrics",
]


@pytest.mark.parametrize("module_name", SHIM_MODULES)
def test_shim_reexports_resolve(module_name: str) -> None:
    module = importlib.import_module(module_name)

    exported = getattr(module, "__all__", None)
    assert exported, f"{module_name} must define a non-empty __all__"

    for name in exported:
        assert hasattr(module, name), (
            f"{module_name}.__all__ advertises '{name}', but it does not resolve "
            f"— a proto message was likely renamed or removed upstream."
        )
