from pydantic import BaseModel


class OptimizeRequest(BaseModel):
    asset_names: list[str]
    current_weights: list[float]
    expected_returns: list[float]
    covariance_matrix: list[list[float]]


class AssetRecommendation(BaseModel):
    asset: str
    currentWeight: float
    optimizedWeight: float
    action: str


class OptimizeResponse(BaseModel):
    optimizedWeights: dict[str, float]
    projectedSharpeRatio: float
    recommendations: list[AssetRecommendation]
