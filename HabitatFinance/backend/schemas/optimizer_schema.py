from pydantic import BaseModel


class OptimizeRequest(BaseModel):
    asset_names: list[str]
    current_weights: list[float]
    expected_returns: list[float]
    covariance_matrix: list[list[float]]
    # Optional ticker symbols (e.g. ["AAPL", "MSFT"]).  When provided the
    # backend fetches live historical data via yfinance and uses it to
    # compute expected_returns and the covariance_matrix, falling back to
    # the caller-supplied values if the live fetch fails.
    tickers: list[str] | None = None


class AssetRecommendation(BaseModel):
    asset: str
    currentWeight: float
    optimizedWeight: float
    action: str
    rationale: str = ""
    rationale_source: str = "ai"  # "ai" | "rule_based"


class OptimizeResponse(BaseModel):
    optimizedWeights: dict[str, float]
    projectedSharpeRatio: float
    recommendations: list[AssetRecommendation]
    # True  → expected returns / covariance were computed from live yfinance data.
    # False → the static fallback file (fallback_market_data.json) was used.
    is_live_data: bool = True
