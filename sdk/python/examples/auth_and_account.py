"""Authenticate and fetch account info.

Usage:
    TRADE_API_SECRET=... TRADE_API_ACCOUNT_ID=... python examples/auth_and_account.py
"""

from __future__ import annotations

import os

from trade_api import TradeAPIClient
from trade_api.accounts import GetAccountRequest


def main() -> None:
    secret = os.environ["TRADE_API_SECRET"]
    account_id = os.environ["TRADE_API_ACCOUNT_ID"]

    with TradeAPIClient(secret=secret) as client:
        # JWT was already fetched during construction; get_token() returns
        # the current cached snapshot without blocking.
        token = client.get_token() or ""
        print(f"JWT (truncated): {token[:32]}...")

        account = client.accounts.GetAccount(GetAccountRequest(account_id=account_id))
        print(account)


if __name__ == "__main__":
    main()
