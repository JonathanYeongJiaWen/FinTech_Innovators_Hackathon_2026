import json
from functools import lru_cache
from pathlib import Path
from fastapi import HTTPException

from schemas.asset_schema import AssetResponse

DATA_PATH = Path(__file__).parent.parent / "mock_database.json"


@lru_cache(maxsize=1)
def load_portfolio_data() -> dict:
    """Read and cache the portfolio JSON file (single in-memory copy)."""
    try:
        with open(DATA_PATH, "r", encoding="utf-8-sig") as f:
            raw = json.load(f)
        return raw.get("_legacy", raw)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio data file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Portfolio data file contains invalid JSON.")


def get_portfolio_assets() -> list[AssetResponse]:
    data = load_portfolio_data()
    return [
        AssetResponse(
            assetId=asset["assetId"],
            name=asset["name"],
            assetClass=asset["assetClass"],
            sector=asset["sector"],
            currentValueUSD=asset["currentValueUSD"],
            liquidityTier=asset["liquidityTier"],
        )
        for asset in data["assets"]
    ]

