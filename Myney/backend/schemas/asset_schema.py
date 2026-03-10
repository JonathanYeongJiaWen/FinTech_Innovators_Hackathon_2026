from pydantic import BaseModel


class AssetResponse(BaseModel):
    assetId: str
    name: str
    assetClass: str
    sector: str
    currentValueUSD: float
    liquidityTier: str
