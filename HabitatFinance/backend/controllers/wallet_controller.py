import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor

from adapters.private_asset_adapter import PrivateAssetAdapter
from adapters.tradfi_adapter import TradfiAdapter
from adapters.web3_adapter import Web3Adapter
from entities.wealth_wallet_item import WealthWalletItem

logger = logging.getLogger(__name__)

# Shared thread pool — yfinance and file I/O are blocking operations
_executor = ThreadPoolExecutor(max_workers=4)


def get_aggregated_wallet(user_id: str) -> dict:
    """
    Aggregate holdings from all three data sources concurrently.

    Each adapter runs in its own thread so that blocking I/O (yfinance HTTP
    calls, disk reads) does not serialize execution.

    Args:
        user_id: The client identifier whose portfolio to assemble.

    Returns:
        A dict with ``user_id``, ``total_value_usd``, ``asset_count``,
        and a ``holdings`` list of serialised WealthWalletItem dicts.
    """
    tradfi_adapter = TradfiAdapter()
    web3_adapter = Web3Adapter()
    private_adapter = PrivateAssetAdapter()

    loop = asyncio.new_event_loop()
    try:
        tradfi_future = loop.run_in_executor(
            _executor, tradfi_adapter.fetch_assets, user_id
        )
        web3_future = loop.run_in_executor(
            _executor, web3_adapter.fetch_assets, user_id
        )
        private_future = loop.run_in_executor(
            _executor, private_adapter.fetch_assets, user_id
        )

        tradfi_items, web3_items, private_items = loop.run_until_complete(
            asyncio.gather(tradfi_future, web3_future, private_future)
        )
    finally:
        loop.close()

    all_items: list[WealthWalletItem] = tradfi_items + web3_items + private_items
    total_value = round(sum(item.total_value for item in all_items), 2)

    logger.info(
        "Aggregated wallet for user=%s: %d holdings, total=$%.2f",
        user_id,
        len(all_items),
        total_value,
    )

    return {
        "user_id": user_id,
        "total_value_usd": total_value,
        "asset_count": len(all_items),
        "holdings": [item.model_dump() for item in all_items],
    }

