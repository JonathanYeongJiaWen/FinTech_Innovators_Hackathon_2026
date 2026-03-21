import asyncio
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import yfinance as yf

from adapters.private_asset_adapter import PrivateAssetAdapter
from adapters.tradfi_adapter import TradfiAdapter
from adapters.web3_adapter import Web3Adapter
from entities.wealth_wallet_item import WealthWalletItem

logger = logging.getLogger(__name__)

# Shared thread pool — yfinance and file I/O are blocking operations
_executor = ThreadPoolExecutor(max_workers=4)
_FALLBACK_DATA_PATH = Path(__file__).parent.parent / "fallback_market_data.json"
_NON_TRADABLE_TICKERS = {"CASH"}
_CRYPTO_TO_YF_TICKER = {
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "USDC": "USDC-USD",
    "USDT": "USDT-USD",
    "WBTC": "WBTC-USD",
    "MATIC": "MATIC-USD",
    "LINK": "LINK-USD",
}
_STATIC_FALLBACK_PRICES = {
    "USDC-USD": 1.0,
    "USDT-USD": 1.0,
}


def _normalize_ticker(raw_ticker: str) -> str:
    ticker = (raw_ticker or "").strip().upper()
    return _CRYPTO_TO_YF_TICKER.get(ticker, ticker)


def _is_tradable_ticker(ticker: str) -> bool:
    upper = ticker.upper()
    return bool(upper) and upper not in _NON_TRADABLE_TICKERS and not upper.startswith("PRIV_")


def _load_fallback_prices() -> dict:
    try:
        with open(_FALLBACK_DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _latest_fallback_price(fallback_data: dict, ticker: str) -> float:
    if ticker in _STATIC_FALLBACK_PRICES:
        return _STATIC_FALLBACK_PRICES[ticker]

    series = fallback_data.get(ticker)
    if not isinstance(series, dict) or not series:
        return 0.0

    try:
        latest_key = max(series.keys(), key=lambda key: int(key))
        latest_value = float(series[latest_key])
        return latest_value if latest_value > 0 else 0.0
    except (ValueError, TypeError):
        return 0.0


def _fetch_live_prices(tickers: set[str], fallback_data: dict) -> dict[str, float]:
    prices: dict[str, float] = {}
    for ticker in tickers:
        price = 0.0
        try:
            fast_info = yf.Ticker(ticker).fast_info
            live = getattr(fast_info, "last_price", None)
            if live and live > 0:
                price = float(live)
        except Exception as exc:
            logger.warning("Live price fetch failed for %s: %s", ticker, exc)

        if price <= 0:
            price = _latest_fallback_price(fallback_data, ticker)

        prices[ticker] = round(price, 6) if price > 0 else 0.0
    return prices


def _aggregate_items_by_ticker(all_items: list[WealthWalletItem]) -> list[WealthWalletItem]:
    grouped: dict[str, dict] = {}

    for item in all_items:
        ticker = _normalize_ticker(item.ticker_or_symbol)
        if not ticker:
            continue

        existing = grouped.get(ticker)
        if existing is None:
            grouped[ticker] = {
                "ticker": ticker,
                "asset_id": ticker,
                "name": item.name,
                "asset_class": item.asset_class,
                "quantity": float(item.quantity),
                "currency": item.currency,
                "last_known_price": float(item.current_price),
            }
        else:
            existing["quantity"] += float(item.quantity)
            if existing["last_known_price"] <= 0 and item.current_price > 0:
                existing["last_known_price"] = float(item.current_price)

    tradable_tickers = {ticker for ticker in grouped if _is_tradable_ticker(ticker)}
    fallback_data = _load_fallback_prices()
    live_prices = _fetch_live_prices(tradable_tickers, fallback_data)

    aggregated: list[WealthWalletItem] = []
    for ticker, row in grouped.items():
        quantity = float(row["quantity"])
        if quantity <= 0:
            continue

        if _is_tradable_ticker(ticker):
            live_price = live_prices.get(ticker, 0.0)
            # Drop tradable rows that cannot be priced live or from fallback.
            if live_price <= 0:
                logger.warning("Dropping tradable asset %s due to missing live price", ticker)
                continue
        else:
            live_price = float(row["last_known_price"])
            if live_price <= 0:
                live_price = 1.0

        total_value = round(quantity * live_price, 2)
        aggregated.append(
            WealthWalletItem(
                asset_id=row["asset_id"],
                name=row["name"],
                ticker_or_symbol=ticker,
                asset_class=row["asset_class"],
                quantity=round(quantity, 8),
                current_price=round(live_price, 6),
                total_value=total_value,
                currency=row["currency"],
            )
        )

    aggregated.sort(key=lambda item: item.total_value, reverse=True)
    return aggregated


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
    deduped_items = _aggregate_items_by_ticker(all_items)
    total_value = round(sum(item.total_value for item in deduped_items), 2)

    logger.info(
        "Aggregated wallet for user=%s: %d holdings, total=$%.2f",
        user_id,
        len(deduped_items),
        total_value,
    )

    return {
        "user_id": user_id,
        "total_value_usd": total_value,
        "asset_count": len(deduped_items),
        "holdings": [item.model_dump() for item in deduped_items],
    }

