from pydantic import BaseModel


class RiskMetrics(BaseModel):
    expectedReturn: float
    volatility: float
    sharpeRatio: float


class LiquidityProfile(BaseModel):
    highLiquidityUSD: float
    lowLiquidityUSD: float
    liquidityWarningFlag: bool


class BehavioralResilienceResponse(BaseModel):
    stabilityRatio: float
    panicRisk: str
    description: str


class SynergyResponse(BaseModel):
    correlationCoefficient: float
    equitiesWeight: float
    digitalAssetsWeight: float
    interpretation: str


class WellnessResponse(BaseModel):
    portfolioId: str
    totalNetWorthUSD: float
    wellnessScore: float
    riskMetrics: RiskMetrics
    liquidityProfile: LiquidityProfile
    behavioralResilience: BehavioralResilienceResponse
    digitalTraditionalSynergy: SynergyResponse
