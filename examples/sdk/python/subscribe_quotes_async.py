"""Subscribe to live quotes using the asyncio client."""

from __future__ import annotations

import asyncio
import os
import sys

from trade_api import AsyncTradeAPIClient
from trade_api.market_data import SubscribeQuoteRequest


async def main(symbols: list[str]) -> None:
    secret = os.environ["TRADE_API_SECRET"]
    async with AsyncTradeAPIClient(secret=secret) as client:
        async for tick in client.market_data.SubscribeQuote(SubscribeQuoteRequest(symbols=symbols)):
            print(tick, flush=True)


if __name__ == "__main__":
    selected_symbols = sys.argv[1:] or ["AAPL@XNAS"]
    asyncio.run(main(selected_symbols))
