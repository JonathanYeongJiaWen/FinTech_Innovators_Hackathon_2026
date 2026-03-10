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


class MilestoneRequest(BaseModel):
    target_amount: float
    cpf_oa_balance: float
    monthly_burn_rate: float


class MilestoneTarget(BaseModel):
    target_name: str
    target_amount: float
    target_date: str


class FinancialSnapshot(BaseModel):
    cpf_oa_balance: float
    cash_reserves: float
    liquid_investments: dict[str, float]
    illiquid_investments: dict[str, float]
    monthly_burn_rate: float


class LiquidityAnalysis(BaseModel):
    cash_shortfall: float
    post_milestone_cash: float
    runway_months: float
    status: str
    recommended_action: str | None


class MilestoneLiquidityResponse(BaseModel):
    milestone: MilestoneTarget
    financial_snapshot: FinancialSnapshot
    analysis: LiquidityAnalysis


PROPERTY_LABELS = {"HDB", "Condo", "Property", "House", "Flat"}


class ScenarioItem(BaseModel):
    label: str
    type: str  # "Goal" or "Shock"
    target_amount: float
    target_date: str | None = None


class ScenariosRequest(BaseModel):
    scenarios: list[ScenarioItem]
    cpf_oa_balance: float = 45_000.0
    cash_reserves: float = 20_000.0
    monthly_burn_rate: float = 4_000.0


class ScenarioResult(BaseModel):
    label: str
    type: str
    status: str
    impact_amount: float
    target_amount: float
    liquid_assets_available: float
    recommendation: str


class ScenariosResponse(BaseModel):
    results: list[ScenarioResult]

