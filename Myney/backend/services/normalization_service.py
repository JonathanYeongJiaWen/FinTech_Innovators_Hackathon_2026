#normalization step here

# services/normalization_service.py
from entities.wealth_wallet_item import WealthWalletItem

class NormalizationService:
    def normalize_tradfi(self, raw):
        items = []

        for asset in raw:
            if asset["type"] == "bank":
                items.append(
                    WealthWalletItem(
                        source="TradFi",
                        asset_id=asset["account_id"],
                        asset_name=asset["name"],
                        asset_class="Cash",
                        quantity=1,
                        current_market_value_usd=asset["balance"],
                        liquidity_tier="High",
                        historical_volatility=0.0,
                        currency=asset["currency"]
                    )
                )

            elif asset["type"] == "stock":
                total_value = asset["units"] * asset["price_per_unit"]
                items.append(
                    WealthWalletItem(
                        source="TradFi",
                        asset_id=asset["ticker"],
                        asset_name=asset["name"],
                        asset_class="Equity",
                        quantity=asset["units"],
                        current_market_value_usd=total_value,
                        liquidity_tier="High",
                        historical_volatility=0.25,
                        currency=asset["currency"]
                    )
                )

        return items

    def normalize_web3(self, raw):
        items = []

        for asset in raw:
            items.append(
                WealthWalletItem(
                    source="Web3",
                    asset_id=asset["token_address"],
                    asset_name=asset["name"],
                    asset_class="Digital Asset",
                    quantity=asset["balance"],
                    current_market_value_usd=asset["balance"] * asset["usd_price"],
                    liquidity_tier="Medium",
                    historical_volatility=0.45,
                    currency="USD"
                )
            )

        return items

    def normalize_private(self, raw):
        items = []

        for asset in raw:
            items.append(
                WealthWalletItem(
                    source="PrivateAsset",
                    asset_id=asset["asset_ref"],
                    asset_name=asset["name"],
                    asset_class="Private Asset",
                    quantity=asset["ownership_fraction"],
                    current_market_value_usd=asset["estimated_value_usd"] * asset["ownership_fraction"],
                    liquidity_tier="Low",
                    historical_volatility=None,
                    currency="USD"
                )
            )

        return items
