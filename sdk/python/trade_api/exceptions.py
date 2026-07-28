"""Typed exceptions for the Limeint Trade API SDK.

Maps gRPC status codes (and the HTTP responses documented in the proto annotations)
to language-native exception types so callers can catch specific failure modes
without inspecting raw status codes.
"""

from __future__ import annotations

from typing import Optional

import grpc


class TradeAPIError(Exception):
    """Base class for all SDK-raised errors."""

    def __init__(
        self,
        message: str,
        *,
        code: Optional[grpc.StatusCode] = None,
        details: Optional[str] = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.details = details

    def __repr__(self) -> str:
        return f"{type(self).__name__}({self.args[0]!r}, code={self.code!r})"


class AuthError(TradeAPIError):
    """Token is missing, expired, or otherwise invalid (gRPC UNAUTHENTICATED / HTTP 401)."""


class PermissionDeniedError(TradeAPIError):
    """Caller is authenticated but not permitted (gRPC PERMISSION_DENIED / HTTP 403)."""


class RateLimitError(TradeAPIError):
    """Rate limit hit (gRPC RESOURCE_EXHAUSTED / HTTP 429).

    The Trade API documents a default limit of 200 requests/minute.
    """


class InvalidArgumentError(TradeAPIError):
    """Request was malformed (gRPC INVALID_ARGUMENT / HTTP 400)."""


class NotFoundError(TradeAPIError):
    """Requested resource does not exist (gRPC NOT_FOUND / HTTP 404)."""


class ServiceUnavailableError(TradeAPIError):
    """Service is temporarily unavailable (gRPC UNAVAILABLE / HTTP 503)."""


class DeadlineExceededError(TradeAPIError):
    """Deadline elapsed before the operation completed (gRPC DEADLINE_EXCEEDED / HTTP 504)."""


class InternalError(TradeAPIError):
    """Server-side error (gRPC INTERNAL / HTTP 500)."""


_STATUS_MAP: dict[grpc.StatusCode, type[TradeAPIError]] = {
    grpc.StatusCode.UNAUTHENTICATED: AuthError,
    grpc.StatusCode.PERMISSION_DENIED: PermissionDeniedError,
    grpc.StatusCode.RESOURCE_EXHAUSTED: RateLimitError,
    grpc.StatusCode.INVALID_ARGUMENT: InvalidArgumentError,
    grpc.StatusCode.NOT_FOUND: NotFoundError,
    grpc.StatusCode.UNAVAILABLE: ServiceUnavailableError,
    grpc.StatusCode.DEADLINE_EXCEEDED: DeadlineExceededError,
    grpc.StatusCode.INTERNAL: InternalError,
}


def from_rpc_error(err: grpc.RpcError) -> TradeAPIError:
    """Convert a grpc.RpcError into the matching typed TradeAPIError."""
    code = err.code() if hasattr(err, "code") else None
    details = err.details() if hasattr(err, "details") else None
    exc_type = _STATUS_MAP.get(code, TradeAPIError) if code is not None else TradeAPIError
    return exc_type(details or str(err), code=code, details=details)


__all__ = [
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
]
