# STEPS to combine all user's data after normalization and ingestion, to get the value of one user after everything has been added.

# services/wallet_service.py
from services.ingestion_service import IngestionService
from services.normalization_service import NormalizationService

class WalletService:
    def __init__(self):
        self.ingestion_service = IngestionService()
        self.normalization_service = NormalizationService()

    def get_unified_wallet(self, user_id: str):
        raw_data = self.ingestion_service.fetch_all_sources(user_id)

        tradfi_items = self.normalization_service.normalize_tradfi(raw_data["tradfi"])
        web3_items = self.normalization_service.normalize_web3(raw_data["web3"])
        private_items = self.normalization_service.normalize_private(raw_data["private"])

        all_items = tradfi_items + web3_items + private_items
        total_value = sum(item.current_market_value_usd for item in all_items)

        return {
            "user_id": user_id,
            "total_value_usd": total_value,
            "items": [item.__dict__ for item in all_items]
        }
