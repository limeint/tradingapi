"""Authenticate and fetch account info.

Usage:
    TRADE_API_SECRET=... python examples/auth_and_account.py
"""

from __future__ import annotations

import os

from trade_api import TradeAPIClient
from trade_api.accounts import GetAccountRequest
from trade_api.auth_messages import TokenDetailsRequest


def main() -> None:
    secret = os.environ["TRADE_API_SECRET"]

    with TradeAPIClient(secret=secret) as client:
        # JWT was already fetched during construction; get_token() returns
        # the current cached snapshot without blocking.
        token = client.get_token() or ""
        print(f"JWT (truncated): {token[:32]}...")

        details = client.auth.TokenDetails(TokenDetailsRequest(token=token))
        if len(details.account_ids) != 1:
            raise RuntimeError(
                f"expected exactly one available account; received {len(details.account_ids)}"
            )
        account_id = details.account_ids[0]
        account = client.accounts.GetAccount(GetAccountRequest(account_id=account_id))
        print(account)


if __name__ == "__main__":
    main()
