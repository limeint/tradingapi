"""Run the RSI 14 threshold example."""

from __future__ import annotations

import logging
from collections.abc import Sequence

from trade_api import TradeAPIClient

from config import parse_config
from runner import run

logger = logging.getLogger(__name__)


def main(argv: Sequence[str] | None = None) -> None:
    config = parse_config(argv)
    logging.basicConfig(
        level=getattr(logging, config.log_level),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    if not config.execute and not config.check:
        logger.warning("Dry-run mode: signals are logged but orders are disabled")

    try:
        with TradeAPIClient(secret=config.secret) as client:
            run(client, config)
    except KeyboardInterrupt:
        logger.info("Strategy stopped")


if __name__ == "__main__":
    main()
