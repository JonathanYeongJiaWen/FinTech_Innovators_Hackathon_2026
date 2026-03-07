import json
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

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
# Endpoint
# ---------------------------------------------------------------------------

@app.get("/api/v1/wellness", response_model=WellnessResponse)
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
