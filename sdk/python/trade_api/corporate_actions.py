"""Corporate-actions-service message types.

Re-exports the proto request/response messages used with
``client.corporate_actions.*`` RPCs.

    from trade_api.corporate_actions import GetFutureDividendsRequest
"""

from .proto.grpc.tradeapi.v1.corporateactions.corporate_actions_service_pb2 import (
    ConvertationType,
    Dividend,
    GetFutureDividendsRequest,
    GetFutureDividendsResponse,
    GetFutureSplitsRequest,
    GetFutureSplitsResponse,
    GetPastDividendsRequest,
    GetPastDividendsResponse,
    GetPastSplitsRequest,
    GetPastSplitsResponse,
    Pagination,
    SortDirection,
    SplitInfo,
)

__all__ = [
    "ConvertationType",
    "Dividend",
    "GetFutureDividendsRequest",
    "GetFutureDividendsResponse",
    "GetFutureSplitsRequest",
    "GetFutureSplitsResponse",
    "GetPastDividendsRequest",
    "GetPastDividendsResponse",
    "GetPastSplitsRequest",
    "GetPastSplitsResponse",
    "Pagination",
    "SortDirection",
    "SplitInfo",
]
