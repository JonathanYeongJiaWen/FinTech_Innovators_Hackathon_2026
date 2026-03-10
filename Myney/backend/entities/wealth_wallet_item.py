from pydantic import BaseModel, Field
from typing import Optional


class WealthWalletItem(BaseModel):
    """
    Canonical representation of a single asset holding across all asset classes.
    Used as the unified output type for all data adapters.
    """
    asset_id: str = Field(..., description="Unique identifier for the asset (ticker, contract address, or internal ref)")
    name: str = Field(..., description="Human-readable asset name")
    ticker_or_symbol: str = Field(..., description="Market ticker or token symbol (e.g. AAPL, ETH)")
    asset_class: str = Field(..., description="Asset class: 'Equities', 'Cash', 'Digital', 'Private'")
    quantity: float = Field(..., description="Number of units / shares / tokens held")
    current_price: float = Field(..., description="Current market price per unit in USD")
    total_value: float = Field(..., description="Total position value in USD (quantity × current_price)")
    currency: str = Field(default="USD", description="Source currency of the holding")

    class Config:
        json_schema_extra = {
            "example": {
                "asset_id": "AAPL",
                "name": "Apple Inc.",
                "ticker_or_symbol": "AAPL",
                "asset_class": "Equities",
                "quantity": 350,
                "current_price": 213.49,
                "total_value": 74721.50,
                "currency": "USD",
            }
        }
