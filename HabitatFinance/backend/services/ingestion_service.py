from adapters.tradfi_adapter import TradFiAdapter
from adapters.web3_adapter import Web3Adapter
from adapters.private_asset_adapter import PrivateAssetAdapter

class IngestionService:
    def __init__(self):
        self.tradfi_adapter = TradFiAdapter()
        self.web3_adapter = Web3Adapter()
        self.private_asset_adapter = PrivateAssetAdapter()

    def fetch_all_sources(self, user_id: str):
        return {
            "tradfi": self.tradfi_adapter.fetch_assets(user_id),
            "web3": self.web3_adapter.fetch_assets(user_id),
            "private": self.private_asset_adapter.fetch_assets(user_id)
        }
