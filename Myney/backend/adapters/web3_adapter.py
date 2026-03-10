import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv

from adapters.base_adapter import BaseAdapter
from entities.wealth_wallet_item import WealthWalletItem

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

logger = logging.getLogger(__name__)

DATA_PATH = Path(__file__).parent.parent / "mock_database.json"

# Mock price oracle for well-known tokens (USD per token).
# In production this would call a real price feed (e.g. CoinGecko, Etherscan token API).
_MOCK_PRICES: dict[str, float] = {
    "ETH": 3_200.00,
    "USDC": 1.00,
    "USDT": 1.00,
    "WBTC": 62_000.00,
    "MATIC": 0.85,
    "LINK": 15.20,
}


class Web3Adapter(BaseAdapter):
    """
    Fetches on-chain / digital-asset holdings for a user.

    The real implementation would call the Etherscan API using the user's
    public wallet address to enumerate ERC-20 token balances.
    For the hackathon, token balances are read from mock_database.json and
    prices come from the _MOCK_PRICES oracle above.

    The ETHERSCAN_API_KEY is loaded from the .env file so it is never
    hard-coded in source.
    """

    def __init__(self) -> None:
        self._api_key: str = os.getenv("ETHERSCAN_API_KEY", "")
        if not self._api_key:
            logger.warning(
                "ETHERSCAN_API_KEY is not set — using mock balances only."
            )

    def _load_web3_data(self, user_id: str) -> dict:
        with open(DATA_PATH, "r") as f:
            db = json.load(f)
        if db.get("client_id") != user_id:
            return {}
        return db.get("web3_holdings", {})

    def _mock_fetch_token_balances(
        self, wallet_address: str, manual_tokens: list[dict]
    ) -> list[dict]:
        """
        Simulates a call to:
          GET https://api.etherscan.io/api
              ?module=account&action=tokentx
              &address={wallet_address}
              &apikey={self._api_key}

        Returns a list of {symbol, quantity} dicts.
        """
        logger.info(
            "[Mock Etherscan] Fetching balances for wallet %s "
            "(API key present: %s)",
            wallet_address,
            bool(self._api_key),
        )
        # In production: make an httpx / requests call to the Etherscan API here.
        return manual_tokens  # Return the mock balances from the database

    def fetch_assets(self, user_id: str) -> list[WealthWalletItem]:
        web3_data = self._load_web3_data(user_id)
        if not web3_data:
            return []

        wallet_address: str = web3_data.get("public_wallet_address", "")
        manual_tokens: list[dict] = web3_data.get("manual_tokens", [])

        token_balances = self._mock_fetch_token_balances(wallet_address, manual_tokens)

        items: list[WealthWalletItem] = []
        for token in token_balances:
            symbol: str = token["symbol"]
            quantity: float = float(token["quantity"])
            price: float = _MOCK_PRICES.get(symbol, 0.0)
            total = round(quantity * price, 2)

            items.append(
                WealthWalletItem(
                    asset_id=f"eth_{symbol.lower()}",
                    name=symbol,
                    ticker_or_symbol=symbol,
                    asset_class="Digital",
                    quantity=quantity,
                    current_price=price,
                    total_value=total,
                    currency="USD",
                )
            )

        return items

