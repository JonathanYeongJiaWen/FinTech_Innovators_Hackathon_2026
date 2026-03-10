from pydantic import BaseModel
from enum import Enum


class PortfolioSummary(BaseModel):
    asset_class_1: str
    asset_class_1_pct: float
    asset_class_2: str
    asset_class_2_pct: float


class ActiveScenario(BaseModel):
    label: str
    type: str          # "Goal" or "Shock"
    status: str        # "At Risk" or "Healthy"
    shortfall: float
    liquid_allocated: float


class ClientSummary(BaseModel):
    client_id: str
    name: str
    net_worth: float
    wellness_score: float
    portfolio_summary: PortfolioSummary
    active_scenarios: list[ActiveScenario]


class InsightRequest(BaseModel):
    portfolio_summary: PortfolioSummary
    wellness_score: float
    active_scenarios: list[ActiveScenario] = []


class InsightResponse(BaseModel):
    primary_risk: str
    recommended_action: str


class AlphaDirection(str, Enum):
    MISSED_GAINS = "MISSED_GAINS"
    PREVENTED_LOSSES = "PREVENTED_LOSSES"
    NEUTRAL = "NEUTRAL"


class BehavioralProfileResponse(BaseModel):
    lossAversion: int
    overconfidence: int
    herdMentality: int
    dispositionEffect: int


class CostOfBehaviorResponse(BaseModel):
    actualPortfolioValue: float
    ghostPortfolioValue: float
    behavioralAlpha: float
    alphaDirection: AlphaDirection


class BehavioralInsightsResponse(BaseModel):
    behavioralProfile: BehavioralProfileResponse
    costOfBehavior: CostOfBehaviorResponse
