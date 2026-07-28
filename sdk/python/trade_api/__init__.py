"""Limeint Trade API — Python SDK.

Thin ergonomic wrapper over the generated gRPC stubs. Handles channel
construction, JWT issuance + auto-refresh, retries on transient failures,
and error mapping. Service methods are invoked directly on the generated
stubs (e.g. ``client.orders.PlaceOrder(...)``) using proto request/response
messages.

Public surface:

- :class:`TradeAPIClient` — synchronous client.
- :class:`AsyncTradeAPIClient` — asyncio client.
- :class:`RetryPolicy` — exponential-backoff configuration.
- :mod:`trade_api.exceptions` — typed errors mapped from gRPC status codes.
- :func:`from_rpc_error` — convert a raw ``grpc.RpcError`` into a typed :class:`TradeAPIError`.
"""

from .aio import AsyncTradeAPIClient
from .client import DEFAULT_ENDPOINT, TradeAPIClient
from .exceptions import (
    AuthError,
    DeadlineExceededError,
    TradeAPIError,
    InternalError,
    InvalidArgumentError,
    NotFoundError,
    PermissionDeniedError,
    RateLimitError,
    ServiceUnavailableError,
    from_rpc_error,
)
from .retry import DEFAULT_POLICY, RetryPolicy

__version__ = "2.18.0"

__all__ = [
    "TradeAPIClient",
    "AsyncTradeAPIClient",
    "DEFAULT_ENDPOINT",
    "RetryPolicy",
    "DEFAULT_POLICY",
    "TradeAPIError",
    "AuthError",
    "PermissionDeniedError",
    "RateLimitError",
    "InvalidArgumentError",
    "NotFoundError",
    "ServiceUnavailableError",
    "DeadlineExceededError",
    "InternalError",
    "from_rpc_error",
    "__version__",
]
