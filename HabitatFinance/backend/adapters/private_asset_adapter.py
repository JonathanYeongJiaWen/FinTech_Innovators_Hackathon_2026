import json
import logging
from pathlib import Path

from adapters.base_adapter import BaseAdapter
from entities.wealth_wallet_item import WealthWalletItem

logger = logging.getLogger(__name__)

DATA_PATH = Path(__file__).parent.parent / "mock_database.json"


class PrivateAssetAdapter(BaseAdapter):
    """
    Fetches illiquid private holdings (real estate, private equity, etc.) for a user.

    Data is sourced entirely from mock_database.json because private assets
    have no public price feed — valuations are manually maintained.
    """

    def _load_holdings(self, user_id: str) -> list[dict]:
        with open(DATA_PATH, "r") as f:
            db = json.load(f)
        if db.get("client_id") != user_id:
            return []
        return db.get("private_holdings", [])

    def fetch_assets(self, user_id: str) -> list[WealthWalletItem]:
        holdings = self._load_holdings(user_id)
        items: list[WealthWalletItem] = []

        for holding in holdings:
            asset_ref: str = holding["asset_ref"]
            description: str = holding["description"]
            asset_type: str = holding["asset_type"]  # e.g. "Real Estate", "Private Equity"
            estimated_value: float = float(holding["estimated_value"])
            ownership_fraction: float = float(holding.get("ownership_fraction", 1.0))
            currency: str = holding.get("currency", "USD")

            # Owned value = appraised value × ownership stake
            owned_value = round(estimated_value * ownership_fraction, 2)

            items.append(
                WealthWalletItem(
                    asset_id=asset_ref,
                    name=description,
                    ticker_or_symbol=asset_ref,
                    asset_class="Private",
                    quantity=ownership_fraction,
                    current_price=round(estimated_value, 2),
                    total_value=owned_value,
                    currency=currency,
                )
            )

        return items

