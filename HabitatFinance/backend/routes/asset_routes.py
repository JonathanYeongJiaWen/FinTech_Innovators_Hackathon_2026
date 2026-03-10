from fastapi import APIRouter

from schemas.asset_schema import AssetResponse
from services.asset_service import get_portfolio_assets

router = APIRouter(tags=["Portfolio Assets"])


@router.get("/api/v1/assets", response_model=list[AssetResponse])
def assets() -> list[AssetResponse]:
    return get_portfolio_assets()

