import json
import logging
from pathlib import Path

import yfinance as yf

from adapters.base_adapter import BaseAdapter
from entities.wealth_wallet_item import WealthWalletItem

logger = logging.getLogger(__name__)

DATA_PATH = Path(__file__).parent.parent / "mock_database.json"

# Tickers that are not traded on a public exchange (cash, deposits, etc.)
_NON_MARKET_TICKERS = {"CASH"}


class TradfiAdapter(BaseAdapter):
    """
    Fetches Traditional Finance holdings (stocks, ETFs, cash) for a user.

    Live prices are retrieved via yfinance for real exchange-traded tickers.
    Non-market entries (e.g. cash / bank deposits) use the stored balance
    directly with a fixed price of 1.0.
    """

    def _load_holdings(self, user_id: str) -> list[dict]:
        with open(DATA_PATH, "r") as f:
            db = json.load(f)
        if db.get("client_id") != user_id:
            return []
        return db.get("tradfi_holdings", [])

    def _fetch_live_price(self, ticker: str) -> float:
        """Return the latest closing price for *ticker* via yfinance."""
        try:
            info = yf.Ticker(ticker).fast_info
            price = getattr(info, "last_price", None)
            if price and price > 0:
                return float(price)
        except Exception as exc:
            logger.warning("yfinance price fetch failed for %s: %s", ticker, exc)
        return 0.0

    def fetch_assets(self, user_id: str) -> list[WealthWalletItem]:
        holdings = self._load_holdings(user_id)
        items: list[WealthWalletItem] = []

        for holding in holdings:
            ticker: str = holding["ticker"]
            name: str = holding["name"]
            quantity: float = float(holding["quantity"])
            currency: str = holding.get("currency", "USD")

            if ticker in _NON_MARKET_TICKERS:
                # Cash / bank deposit — no live price needed
                balance = float(holding.get("balance", quantity))
                items.append(
                    WealthWalletItem(
                        asset_id=holding.get("account_id", ticker),
                        name=name,
                        ticker_or_symbol=ticker,
                        asset_class="Cash",
                        quantity=balance,
                        current_price=1.0,
                        total_value=balance,
                        currency=currency,
                    )
                )
            else:
                price = self._fetch_live_price(ticker)
                total = round(quantity * price, 2)
                items.append(
                    WealthWalletItem(
                        asset_id=ticker,
                        name=name,
                        ticker_or_symbol=ticker,
                        asset_class="Equities",
                        quantity=quantity,
                        current_price=round(price, 4),
                        total_value=total,
                        currency=currency,
                    )
                )

        return items

