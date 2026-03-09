# FEATURE 2: Financial Wellness Engine
# FEATURE 4: Macro Stress-Tester

import json
import os
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from fastapi import FastAPI, HTTPException
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERROR: Could not find GEMINI_API_KEY in .env file!")
else:
    print(f"✅ SUCCESS: API Key loaded (Starts with: {api_key[:5]})")

app = FastAPI(title="Habitat Finance API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# ---------------------------------------------------------------------------
# Helper Functions for Advanced Metrics
# ---------------------------------------------------------------------------

def calculate_behavioral_resilience(data: dict) -> BehavioralResilienceResponse:
    """
    Calculate Behavioral Resilience Index (Stability Ratio).
    
    Formula: Compares user's trade volume against market volatility.
    If market dropped >3% but user held position, ratio should be >0.80.
    
    Stability Ratio = 1.0 - (panic_factor * volatility_factor)
    """
    market_data = data.get("marketData", {})
    trade_history = data.get("tradeHistory", {})
    
    # Get market volatility (use tech index as it's more relevant for typical portfolio)
    tech_volatility = market_data.get("techIndexVolatility30d", 0.20)
    tech_return = market_data.get("techIndexReturn30d", 0.0)
    
    # Get trade behavior
    total_trades = trade_history.get("totalTradesLast30d", 0)
    panic_sells = trade_history.get("panicSellsLast30d", 0)
    held_during_drop = trade_history.get("heldDuringDrop", True)
    largest_drawdown = abs(trade_history.get("largestDrawdownWithoutSell", 0.0))
    
    # Calculate panic factor (0.0 = no panic, 1.0 = high panic)
    if total_trades == 0:
        panic_factor = 0.0  # No trades = good discipline
    else:
        panic_factor = panic_sells / total_trades
    
    # If market dropped >3% and user held position, boost stability
    market_stress_bonus = 0.0
    if tech_return < -0.03 and held_during_drop:
        market_stress_bonus = 0.15
    
    # Calculate stability ratio
    volatility_factor = min(tech_volatility, 0.5)  # Cap at 0.5
    stability_ratio = 1.0 - (panic_factor * volatility_factor) + market_stress_bonus
    
    # Clamp to [0.0, 1.0]
    stability_ratio = max(0.0, min(1.0, stability_ratio))
    
    # Determine panic risk level
    if stability_ratio >= 0.80:
        panic_risk = "Low"
        description = f"You haven't made any emotional trades during the recent {abs(tech_return)*100:.1f}% tech dip. Resilience is improving your Wellness Score."
    elif stability_ratio >= 0.60:
        panic_risk = "Medium"
        description = "Your trading behavior shows moderate emotional discipline. Consider reviewing your investment strategy during market volatility."
    else:
        panic_risk = "High"
        description = "Trading patterns suggest emotional responses to market movements. Consider implementing automatic rebalancing strategies."
    
    return BehavioralResilienceResponse(
        stabilityRatio=round(stability_ratio, 2),
        panicRisk=panic_risk,
        description=description
    )


def calculate_digital_traditional_synergy(df: pd.DataFrame, data: dict) -> SynergyResponse:
    """
    Calculate Pearson Correlation between Equities and Digital Assets.
    
    Uses daily returns to compute correlation coefficient (r).
    """
    daily_returns = data.get("dailyReturns", {})
    equities_returns = daily_returns.get("equities", [])
    digital_returns = daily_returns.get("digitalAssets", [])
    
    # Calculate Pearson correlation if both arrays exist and have same length
    if len(equities_returns) > 0 and len(digital_returns) > 0 and len(equities_returns) == len(digital_returns):
        correlation_matrix = np.corrcoef(equities_returns, digital_returns)
        correlation = float(correlation_matrix[0, 1])
    else:
        correlation = 0.0
    
    # Calculate weights
    total_value = df["currentValueUSD"].sum()
    equities_value = df[df["assetClass"] == "Equities"]["currentValueUSD"].sum()
    digital_value = df[df["assetClass"] == "Digital_Assets"]["currentValueUSD"].sum()
    
    equities_weight = float(equities_value / total_value) if total_value > 0 else 0.0
    digital_weight = float(digital_value / total_value) if total_value > 0 else 0.0
    
    # Interpret correlation
    if abs(correlation) < 0.3:
        interpretation = "Diversified"
    elif correlation > 0.7:
        interpretation = "Highly Correlated"
    elif correlation < -0.7:
        interpretation = "Inversely Correlated"
    else:
        interpretation = "Moderately Correlated"
    
    return SynergyResponse(
        correlationCoefficient=round(correlation, 2),
        equitiesWeight=round(equities_weight, 2),
        digitalAssetsWeight=round(digital_weight, 2),
        interpretation=interpretation
    )


def calculate_diversification_score(df: pd.DataFrame) -> float:
    """
    Calculate diversification score based on asset class distribution.
    Uses Herfindahl-Hirschman Index (HHI) inverse.
    
    Returns: Score from 0.0 to 1.0 (higher = more diversified)
    """
    total = df["currentValueUSD"].sum()
    if total == 0:
        return 0.0
    
    class_weights = df.groupby("assetClass")["currentValueUSD"].sum() / total
    hhi = (class_weights ** 2).sum()
    
    # Convert HHI to diversification score (1.0 = perfectly diversified, 0.0 = concentrated)
    # HHI ranges from 1/n to 1.0, where n is number of asset classes
    n_classes = len(class_weights)
    if n_classes <= 1:
        return 0.0
    
    min_hhi = 1.0 / n_classes
    diversification_score = (1.0 - hhi) / (1.0 - min_hhi)
    
    return max(0.0, min(1.0, diversification_score))


def calculate_liquidity_score(df: pd.DataFrame) -> float:
    """
    Calculate liquidity score based on the proportion of high-liquidity assets.
    
    Returns: Score from 0.0 to 1.0 (higher = more liquid)
    """
    total = df["currentValueUSD"].sum()
    if total == 0:
        return 0.0
    
    high_liquidity_value = df[df["liquidityTier"] == "High"]["currentValueUSD"].sum()
    liquidity_ratio = high_liquidity_value / total
    
    # Score: >75% high liquidity = 1.0, <25% = 0.0
    liquidity_score = max(0.0, min(1.0, (liquidity_ratio - 0.25) / 0.50 + 0.5))
    
    return liquidity_score


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
    wellness score using weighted average of:
    - 30% Diversification
    - 30% Liquidity
    - 20% Sharpe Ratio
    - 20% Behavioral Resilience
    
    Returns full liquidity breakdown, behavioral resilience, and synergy metrics.
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
            "beta":                asset["riskMetrics"].get("beta", 1.0),
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
            behavioralResilience=BehavioralResilienceResponse(
                stabilityRatio=0.0, panicRisk="Unknown", description="No data available"
            ),
            digitalTraditionalSynergy=SynergyResponse(
                correlationCoefficient=0.0, equitiesWeight=0.0, 
                digitalAssetsWeight=0.0, interpretation="No data"
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

    # --- Calculate Component Scores for Unified Wellness --------------------
    # Normalize Sharpe to 0-1 scale
    sharpe_score = max(0.0, min(1.0, sharpe_ratio / SHARPE_MAX))
    
    # Diversification score (0-1)
    diversification_score = calculate_diversification_score(df)
    
    # Liquidity score (0-1)
    liquidity_score = calculate_liquidity_score(df)
    
    # Behavioral resilience score (0-1)
    behavioral_resilience = calculate_behavioral_resilience(data)
    resilience_score = behavioral_resilience.stabilityRatio
    
    # Unified Wellness Score: weighted average (0-100)
    # 30% Diversification, 30% Liquidity, 20% Sharpe Ratio, 20% Behavioral Resilience
    wellness_score: float = round(
        (0.30 * diversification_score + 
         0.30 * liquidity_score + 
         0.20 * sharpe_score + 
         0.20 * resilience_score) * 100.0,
        1
    )

    # --- Calculate Digital-Traditional Synergy ------------------------------
    synergy = calculate_digital_traditional_synergy(df, data)

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
        behavioralResilience=behavioral_resilience,
        digitalTraditionalSynergy=synergy,
    )


# ---------------------------------------------------------------------------
# Feature 4: Macro Stress-Tester
# ---------------------------------------------------------------------------

# Asset classes considered highly liquid for the liquidity check.
LIQUID_ASSET_CLASSES = {"Cash", "Equities"}
# Asset classes / sectors that signal illiquid real-asset concentration.
ILLIQUID_REAL_ASSET_INDICATORS = {"Real Estate", "HDB", "Private_Equity"}


def _compute_wellness_score(df: pd.DataFrame, value_col: str) -> tuple[float, float]:
    """
    Advanced wellness scoring incorporating:
      1. Sharpe Ratio (base score)
      2. Concentration Risk Adjustment (volatility penalty)
      3. Beta Risk Penalty (high-beta or excessively low-beta portfolios)
      4. Liquidity Penalty (insufficient liquid holdings relative to
         illiquid real-asset exposure)

    Returns (sharpe_ratio, wellness_score) with score clamped to [0, 100].
    """
    total = float(df[value_col].sum())
    if total == 0.0:
        return 0.0, 0.0

    weight = df[value_col] / total

    # --- Sharpe Ratio -------------------------------------------------------
    port_return = float(np.dot(weight, df["expectedReturn"]))
    port_vol = float(np.dot(weight, df["historicalVolatility"]))

    # Concentration risk: penalise volatility when one asset class > 60%.
    class_weights = df.groupby("assetClass")[value_col].sum() / total
    if float(class_weights.max()) > 0.60:
        port_vol *= 1.15

    sharpe = float((port_return - RISK_FREE_RATE) / port_vol) if port_vol else 0.0
    wellness = min(max(sharpe / SHARPE_MAX * 100.0, 0.0), 100.0)

    # --- Beta Risk Penalty --------------------------------------------------
    if "beta" in df.columns:
        port_beta = float(np.dot(weight, df["beta"]))
        if port_beta > 1.2 or port_beta < 0.5:
            wellness *= 0.90  # 10 % penalty

    # --- Liquidity Penalty --------------------------------------------------
    liquid_mask = df["assetClass"].isin(LIQUID_ASSET_CLASSES)
    liquid_weight = float(weight[liquid_mask].sum())

    has_illiquid_real_assets = (
        df["assetClass"].isin(ILLIQUID_REAL_ASSET_INDICATORS).any()
        or df.get("sector", pd.Series(dtype=str)).isin(ILLIQUID_REAL_ASSET_INDICATORS).any()
    )
    if liquid_weight < 0.15 and has_illiquid_real_assets:
        wellness -= 15.0

    # --- Clamp to [0, 100] --------------------------------------------------
    wellness = round(min(max(wellness, 0.0), 100.0), 1)
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
            "beta":                asset["riskMetrics"].get("beta", 1.0),
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


# ---------------------------------------------------------------------------
# Feature: Portfolio Assets
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Feature: Portfolio Optimizer models
# ---------------------------------------------------------------------------

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


class AssetResponse(BaseModel):
    assetId: str
    name: str
    assetClass: str
    sector: str
    currentValueUSD: float
    liquidityTier: str


@app.post(
    "/api/v1/optimize-portfolio",
    response_model=OptimizeResponse,
    tags=["Portfolio Optimizer"],
)
def optimize_portfolio(request: OptimizeRequest) -> OptimizeResponse:
    """
    Portfolio Optimizer.

    Accepts current asset weights, expected annualized returns, and a
    covariance matrix.  Uses scipy.optimize.minimize to find the weight
    allocation that maximises the Sharpe Ratio (minimises negative Sharpe)
    subject to fully-invested and long-only constraints.
    """
    n = len(request.asset_names)

    # --- Input validation ---------------------------------------------------
    if not (n == len(request.current_weights) == len(request.expected_returns)):
        raise HTTPException(
            status_code=400,
            detail="asset_names, current_weights, and expected_returns must have the same length.",
        )
    if len(request.covariance_matrix) != n or any(len(row) != n for row in request.covariance_matrix):
        raise HTTPException(
            status_code=400,
            detail=f"covariance_matrix must be an {n}x{n} matrix.",
        )
    if n == 0:
        raise HTTPException(status_code=400, detail="Portfolio must contain at least one asset.")

    mu = np.array(request.expected_returns)
    cov = np.array(request.covariance_matrix)

    # Verify covariance matrix is symmetric
    if not np.allclose(cov, cov.T):
        raise HTTPException(status_code=400, detail="Covariance matrix must be symmetric.")

    # Tikhonov regularisation: guarantee positive-definiteness so SLSQP
    # cannot exploit floating-point near-singularities.
    np.fill_diagonal(cov, cov.diagonal() + 1e-6)

    # --- Negative Sharpe objective ------------------------------------------
    def neg_sharpe(weights: np.ndarray) -> float:
        port_return = float(weights @ mu)
        port_vol = float(np.sqrt(max(0.0, weights @ cov @ weights)))
        return -((port_return - RISK_FREE_RATE) / (port_vol + 1e-8))

    # --- Constraints & bounds -----------------------------------------------
    constraints = ({"type": "eq", "fun": lambda w: np.sum(w) - 1.0})
    bounds = [(0.0, 1.0)] * n
    initial_weights = np.array(request.current_weights)

    # Fallback to equal-weight start if current weights don't sum to ~1
    if abs(initial_weights.sum() - 1.0) > 0.05:
        initial_weights = np.ones(n) / n

    # --- Optimise -----------------------------------------------------------
    result = minimize(
        neg_sharpe,
        initial_weights,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
    )
    if result.success:
        opt_weights = result.x
        projected_sharpe = float(-result.fun)
    else:
        # Graceful fallback: return the original weights so the UI never crashes.
        opt_weights = np.array(request.current_weights)
        projected_sharpe = float(-neg_sharpe(opt_weights))

    # --- Build recommendations ----------------------------------------------
    recommendations: list[AssetRecommendation] = []
    for i, name in enumerate(request.asset_names):
        cur_w = request.current_weights[i]
        opt_w = round(float(opt_weights[i]), 6)
        if not result.success:
            action = "Hold"
        else:
            diff = opt_w - cur_w
            if diff > 0.005:
                action = f"Buy (+{diff:.2%})"
            elif diff < -0.005:
                action = f"Sell ({abs(diff):.2%})"
            else:
                action = "Hold"
        recommendations.append(
            AssetRecommendation(
                asset=name,
                currentWeight=round(cur_w, 6),
                optimizedWeight=opt_w,
                action=action,
            )
        )

    optimized_weights = {
        name: round(float(opt_weights[i]), 6)
        for i, name in enumerate(request.asset_names)
    }

    return OptimizeResponse(
        optimizedWeights=optimized_weights,
        projectedSharpeRatio=round(projected_sharpe, 6),
        recommendations=recommendations,
    )


@lru_cache(maxsize=1)
def load_portfolio_data() -> dict:
    """Read and cache the portfolio JSON file (single in-memory copy)."""
    try:
        with open(DATA_PATH, "r", encoding="utf-8-sig") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio data file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Portfolio data file contains invalid JSON.")


@app.get(
    "/api/v1/assets",
    response_model=list[AssetResponse],
    tags=["Portfolio Assets"],
)
def get_portfolio_assets() -> list[AssetResponse]:
    """Return the raw asset list from the portfolio data file."""
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
