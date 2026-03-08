# FEATURE 2: Financial Wellness Engine
# FEATURE 4: Macro Stress-Tester

import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERROR: Could not find GEMINI_API_KEY in .env file!")
else:
    print(f"✅ SUCCESS: API Key loaded (Starts with: {api_key[:5]})")

app = FastAPI(title="Habitat Finance API", version="1.0.0")

DATA_PATH = Path(__file__).parent / "mock_database.json"
RISK_FREE_RATE = 0.03
SHARPE_MAX = 1.5


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class RiskMetrics(BaseModel):
    expectedReturn: float
    volatility: float
    sharpeRatio: float


class LiquidityProfile(BaseModel):
    highLiquidityUSD: float
    lowLiquidityUSD: float
    liquidityWarningFlag: bool


class WellnessResponse(BaseModel):
    portfolioId: str
    totalNetWorthUSD: float
    wellnessScore: float
    riskMetrics: RiskMetrics
    liquidityProfile: LiquidityProfile


# ---------------------------------------------------------------------------
# Feature 4 models
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@app.get(
    "/api/v1/wellness", 
    response_model=WellnessResponse, 
    tags=["Feature 2: Financial Wellness Engine"]
)
def get_financial_wellness() -> WellnessResponse:
    """
    Financial Wellness Engine.

    Loads portfolio data, computes the Sharpe Ratio, maps it to a 0-100
    wellness score, and returns a full liquidity breakdown.
    """
    # --- Load data ----------------------------------------------------------
    try:
        with open(DATA_PATH, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio data file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Portfolio data file contains invalid JSON.")

    portfolio_id: str = data["portfolioId"]

    # --- Build DataFrame (flatten nested riskMetrics) -----------------------
    records = [
        {
            "currentValueUSD":     asset["currentValueUSD"],
            "assetClass":          asset["assetClass"],
            "liquidityTier":       asset["liquidityTier"],
            "expectedReturn":      asset["riskMetrics"]["expectedReturn"],
            "historicalVolatility": asset["riskMetrics"]["historicalVolatility"],
        }
        for asset in data["assets"]
    ]
    df = pd.DataFrame(records)

    # --- Data Processing ----------------------------------------------------
    total_value: float = float(df["currentValueUSD"].sum())

    # Safety guard: empty portfolio returns a zeroed response.
    if total_value == 0.0:
        return WellnessResponse(
            portfolioId=portfolio_id,
            totalNetWorthUSD=0.0,
            wellnessScore=0.0,
            riskMetrics=RiskMetrics(expectedReturn=0.0, volatility=0.0, sharpeRatio=0.0),
            liquidityProfile=LiquidityProfile(
                highLiquidityUSD=0.0, lowLiquidityUSD=0.0, liquidityWarningFlag=False
            ),
        )

    df["weight"] = df["currentValueUSD"] / total_value

    # --- Quantitative Math: Sharpe Ratio ------------------------------------
    portfolio_return: float = float(np.dot(df["weight"], df["expectedReturn"]))
    portfolio_volatility: float = float(np.dot(df["weight"], df["historicalVolatility"]))

    # Simple Concentration Risk Adjustment:
    # If any single asset class dominates >60% of the portfolio, apply a 15%
    # penalty to volatility before computing the Sharpe Ratio, reflecting
    # undiversified concentration risk.
    class_weights = df.groupby("assetClass")["weight"].sum()
    if float(class_weights.max()) > 0.60:
        portfolio_volatility *= 1.15

    # Safety guard: flat volatility means the Sharpe Ratio is undefined.
    if portfolio_volatility == 0.0:
        sharpe_ratio: float = 0.0
    else:
        sharpe_ratio = float((portfolio_return - RISK_FREE_RATE) / portfolio_volatility)

    # Wellness Score: linear map Sharpe [0, SHARPE_MAX] → [0, 100], clamped.
    wellness_score: float = round(
        min(max(sharpe_ratio / SHARPE_MAX * 100.0, 0.0), 100.0), 1
    )

    # --- Liquidity Profiling ------------------------------------------------
    liquidity_by_tier = df.groupby("liquidityTier")["currentValueUSD"].sum()
    high_liquidity_usd: float = float(liquidity_by_tier.get("High", 0.0))
    low_liquidity_usd: float  = float(liquidity_by_tier.get("Low",  0.0))
    liquidity_warning: bool   = (low_liquidity_usd / total_value) > 0.60

    # --- Build response -----------------------------------------------------
    return WellnessResponse(
        portfolioId=portfolio_id,
        totalNetWorthUSD=round(float(total_value), 2),
        wellnessScore=wellness_score,
        riskMetrics=RiskMetrics(
            expectedReturn=round(float(portfolio_return), 6),
            volatility=round(float(portfolio_volatility), 6),
            sharpeRatio=round(float(sharpe_ratio), 6),
        ),
        liquidityProfile=LiquidityProfile(
            highLiquidityUSD=round(float(high_liquidity_usd), 2),
            lowLiquidityUSD=round(float(low_liquidity_usd), 2),
            liquidityWarningFlag=bool(liquidity_warning),
        ),
    )


# ---------------------------------------------------------------------------
# Feature 4: Macro Stress-Tester
# ---------------------------------------------------------------------------

def _compute_wellness_score(df: pd.DataFrame, value_col: str) -> tuple[float, float]:
    """
    Shared helper: given a DataFrame with a value column, expected returns,
    volatilities, and asset classes, returns (sharpe_ratio, wellness_score).
    """
    total = float(df[value_col].sum())
    if total == 0.0:
        return 0.0, 0.0

    weight = df[value_col] / total
    port_return = float(np.dot(weight, df["expectedReturn"]))
    port_vol = float(np.dot(weight, df["historicalVolatility"]))

    class_weights = df.groupby("assetClass")[value_col].sum() / total
    if float(class_weights.max()) > 0.60:
        port_vol *= 1.15

    sharpe = float((port_return - RISK_FREE_RATE) / port_vol) if port_vol else 0.0
    wellness = round(min(max(sharpe / SHARPE_MAX * 100.0, 0.0), 100.0), 1)
    return sharpe, wellness


@app.post(
    "/api/v1/stress-test",
    response_model=ScenarioResponse,
    tags=["Feature 4: Macro Stress-Tester"],
)
async def run_stress_test(request: ScenarioRequest) -> ScenarioResponse:
    """
    Macro Stress-Tester.

    Applies a named macroeconomic shock to the portfolio using sector-specific
    vectorised multipliers, recalculates the Sharpe-based Wellness Score, and
    returns an AI-generated analysis powered by GPT-4o-mini.
    """
    if request.scenario_id not in VALID_SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario_id '{request.scenario_id}'. "
                   f"Must be one of: {sorted(VALID_SCENARIOS)}.",
        )

    # --- Load data ----------------------------------------------------------
    try:
        with open(DATA_PATH, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio data file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Portfolio data file contains invalid JSON.")

    # --- Build DataFrame ----------------------------------------------------
    records = [
        {
            "name":                asset["name"],
            "assetClass":          asset["assetClass"],
            "sector":              asset["sector"],
            "currentValueUSD":     asset["currentValueUSD"],
            "liquidityTier":       asset["liquidityTier"],
            "expectedReturn":      asset["riskMetrics"]["expectedReturn"],
            "historicalVolatility": asset["riskMetrics"]["historicalVolatility"],
        }
        for asset in data["assets"]
    ]
    df = pd.DataFrame(records)

    # --- Baseline wellness --------------------------------------------------
    original_total = float(df["currentValueUSD"].sum())
    _, original_wellness = _compute_wellness_score(df, "currentValueUSD")

    # --- Apply sector-specific shocks ---------------------------------------
    s = request.severity_multiplier
    shocked = df["currentValueUSD"].copy()

    if request.scenario_id == "TECH_CRASH":
        tech_equity_mask  = (df["sector"] == "Technology") & (df["assetClass"] == "Equities")
        other_equity_mask = (df["sector"] != "Technology") & (df["assetClass"] == "Equities")
        shocked[tech_equity_mask]  *= (1.0 - 0.30 * s)
        shocked[other_equity_mask] *= (1.0 - 0.10 * s)
        # Fixed_Income: multiplier 1.0 — no change

    elif request.scenario_id == "FED_RATE_HIKE":
        equity_mask = df["assetClass"] == "Equities"
        fi_mask     = df["assetClass"] == "Fixed_Income"
        shocked[equity_mask] *= (1.0 - 0.15 * s)
        shocked[fi_mask]     *= (1.0 - 0.05 * s)

    df["shockedValueUSD"] = shocked

    # --- Projected metrics --------------------------------------------------
    projected_total = float(df["shockedValueUSD"].sum())
    net_change_usd  = round(projected_total - original_total, 2)

    _, projected_wellness = _compute_wellness_score(df, "shockedValueUSD")

    # --- Worst-performing asset (by % decline) ------------------------------
    df["pct_change"] = (df["shockedValueUSD"] - df["currentValueUSD"]) / df["currentValueUSD"]
    worst_asset_name = str(df.loc[df["pct_change"].idxmin(), "name"])

    # --- Asynchronous Gemini analysis ---------------------------------------
    scenario_name = SCENARIO_NAMES[request.scenario_id]
    prompt = (
        "You are a professional Schroders wealth advisor providing concise, "
        "expert financial analysis to high-net-worth clients. "
        f"A client's portfolio has been subjected to the '{scenario_name}' "
        f"macroeconomic scenario with a severity multiplier of {s:.1f}. "
        f"Their total portfolio net worth changed by ${net_change_usd:,.2f} USD. "
        f"The worst-performing asset was '{worst_asset_name}'. "
        f"In exactly 2 sentences, explain why this portfolio changed under this "
        f"scenario and what it means for the client going forward."
    )

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash", contents=prompt
    )
    ai_analysis = response.text

    # --- Build response -----------------------------------------------------
    return ScenarioResponse(
        scenarioName=scenario_name,
        originalNetWorthUSD=round(original_total, 2),
        projectedNetWorthUSD=round(projected_total, 2),
        netChangeUSD=net_change_usd,
        originalWellnessScore=original_wellness,
        projectedWellnessScore=projected_wellness,
        aiAnalysis=ai_analysis,
    )
