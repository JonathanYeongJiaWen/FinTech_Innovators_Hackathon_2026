# stress_test_schema.py
from pydantic import BaseModel

VALID_SCENARIOS = {"TECH_CRASH", "FED_RATE_HIKE"}

SCENARIO_NAMES: dict[str, str] = {
    "TECH_CRASH": "Technology Sector Crash",
    "FED_RATE_HIKE": "Federal Reserve Rate Hike",
}

class ScenarioRequest(BaseModel):
    scenario_id: str
    severity_multiplier: float = 1.0


class ScenarioResponse(BaseModel):
    scenarioName: str
    originalNetWorthUSD: float
    projectedNetWorthUSD: float
    netChangeUSD: float
    originalWellnessScore: float
    projectedWellnessScore: float
    aiAnalysis: str
