import json
import numpy as np
import pandas as pd
from pathlib import Path
from fastapi import HTTPException
from google import genai
import os

from schemas.wellness_schema import (
    RiskMetrics,
    LiquidityProfile,
    BehavioralResilienceResponse,
    SynergyResponse,
    WellnessResponse,
    MilestoneRequest,
    MilestoneLiquidityResponse,
    MilestoneTarget,
    FinancialSnapshot,
    LiquidityAnalysis,
    ScenariosRequest,
    ScenariosResponse,
    ScenarioResult,
    PROPERTY_LABELS,
)

DATA_PATH = Path(__file__).parent.parent / "mock_database.json"
RISK_FREE_RATE = 0.03
SHARPE_MAX = 1.5

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# ---------------------------------------------------------------------------
# Helper: Behavioral Resilience
# ---------------------------------------------------------------------------

def calculate_behavioral_resilience(data: dict) -> BehavioralResilienceResponse:
    market_data = data.get("marketData", {})
    trade_history = data.get("tradeHistory", {})

    tech_volatility = market_data.get("techIndexVolatility30d", 0.20)
    tech_return = market_data.get("techIndexReturn30d", 0.0)

    total_trades = trade_history.get("totalTradesLast30d", 0)
    panic_sells = trade_history.get("panicSellsLast30d", 0)
    held_during_drop = trade_history.get("heldDuringDrop", True)

    panic_factor = 0.0 if total_trades == 0 else panic_sells / total_trades

    market_stress_bonus = 0.0
    if tech_return < -0.03 and held_during_drop:
        market_stress_bonus = 0.15

    volatility_factor = min(tech_volatility, 0.5)
    stability_ratio = 1.0 - (panic_factor * volatility_factor) + market_stress_bonus
    stability_ratio = max(0.0, min(1.0, stability_ratio))

    if stability_ratio >= 0.80:
        panic_risk = "Low"
        description = (
            f"You haven't made any emotional trades during the recent "
            f"{abs(tech_return) * 100:.1f}% tech dip. Resilience is improving your Wellness Score."
        )
    elif stability_ratio >= 0.60:
        panic_risk = "Medium"
        description = "Your trading behavior shows moderate emotional discipline. Consider reviewing your investment strategy during market volatility."
    else:
        panic_risk = "High"
        description = "Trading patterns suggest emotional responses to market movements. Consider implementing automatic rebalancing strategies."

    return BehavioralResilienceResponse(
        stabilityRatio=round(stability_ratio, 2),
        panicRisk=panic_risk,
        description=description,
    )


# ---------------------------------------------------------------------------
# Helper: Digital-Traditional Synergy
# ---------------------------------------------------------------------------

def calculate_digital_traditional_synergy(df: pd.DataFrame, data: dict) -> SynergyResponse:
    daily_returns = data.get("dailyReturns", {})
    equities_returns = daily_returns.get("equities", [])
    digital_returns = daily_returns.get("digitalAssets", [])

    if len(equities_returns) > 0 and len(digital_returns) > 0 and len(equities_returns) == len(digital_returns):
        correlation = float(np.corrcoef(equities_returns, digital_returns)[0, 1])
    else:
        correlation = 0.0

    total_value = df["currentValueUSD"].sum()
    equities_weight = float(df[df["assetClass"] == "Equities"]["currentValueUSD"].sum() / total_value) if total_value > 0 else 0.0
    digital_weight = float(df[df["assetClass"] == "Digital_Assets"]["currentValueUSD"].sum() / total_value) if total_value > 0 else 0.0

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
        interpretation=interpretation,
    )


# ---------------------------------------------------------------------------
# Helper: Diversification Score
# ---------------------------------------------------------------------------

def calculate_diversification_score(df: pd.DataFrame) -> float:
    total = df["currentValueUSD"].sum()
    if total == 0:
        return 0.0
    class_weights = df.groupby("assetClass")["currentValueUSD"].sum() / total
    hhi = (class_weights ** 2).sum()
    n_classes = len(class_weights)
    if n_classes <= 1:
        return 0.0
    min_hhi = 1.0 / n_classes
    return max(0.0, min(1.0, (1.0 - hhi) / (1.0 - min_hhi)))


# ---------------------------------------------------------------------------
# Helper: Liquidity Score
# ---------------------------------------------------------------------------

def calculate_liquidity_score(df: pd.DataFrame) -> float:
    total = df["currentValueUSD"].sum()
    if total == 0:
        return 0.0
    high_liquidity_value = df[df["liquidityTier"] == "High"]["currentValueUSD"].sum()
    liquidity_ratio = high_liquidity_value / total
    return max(0.0, min(1.0, (liquidity_ratio - 0.25) / 0.50 + 0.5))


# ---------------------------------------------------------------------------
# Service: Financial Wellness
# ---------------------------------------------------------------------------

def get_financial_wellness() -> WellnessResponse:
    try:
        with open(DATA_PATH, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio data file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Portfolio data file contains invalid JSON.")

    data = data.get("_legacy", data)
    portfolio_id: str = data["portfolioId"]

    records = [
        {
            "currentValueUSD":      asset["currentValueUSD"],
            "assetClass":           asset["assetClass"],
            "liquidityTier":        asset["liquidityTier"],
            "expectedReturn":       asset["riskMetrics"]["expectedReturn"],
            "historicalVolatility": asset["riskMetrics"]["historicalVolatility"],
            "beta":                 asset["riskMetrics"].get("beta", 1.0),
        }
        for asset in data["assets"]
    ]
    df = pd.DataFrame(records)
    total_value = float(df["currentValueUSD"].sum())

    if total_value == 0.0:
        return WellnessResponse(
            portfolioId=portfolio_id,
            totalNetWorthUSD=0.0,
            wellnessScore=0.0,
            riskMetrics=RiskMetrics(expectedReturn=0.0, volatility=0.0, sharpeRatio=0.0),
            liquidityProfile=LiquidityProfile(highLiquidityUSD=0.0, lowLiquidityUSD=0.0, liquidityWarningFlag=False),
            behavioralResilience=BehavioralResilienceResponse(stabilityRatio=0.0, panicRisk="Unknown", description="No data available"),
            digitalTraditionalSynergy=SynergyResponse(correlationCoefficient=0.0, equitiesWeight=0.0, digitalAssetsWeight=0.0, interpretation="No data"),
        )

    df["weight"] = df["currentValueUSD"] / total_value
    portfolio_return = float(np.dot(df["weight"], df["expectedReturn"]))
    portfolio_volatility = float(np.dot(df["weight"], df["historicalVolatility"]))

    class_weights = df.groupby("assetClass")["weight"].sum()
    if float(class_weights.max()) > 0.60:
        portfolio_volatility *= 1.15

    sharpe_ratio = float((portfolio_return - RISK_FREE_RATE) / portfolio_volatility) if portfolio_volatility != 0.0 else 0.0
    sharpe_score = max(0.0, min(1.0, sharpe_ratio / SHARPE_MAX))
    diversification_score = calculate_diversification_score(df)
    liquidity_score = calculate_liquidity_score(df)
    behavioral_resilience = calculate_behavioral_resilience(data)
    resilience_score = behavioral_resilience.stabilityRatio

    wellness_score = round(
        (0.30 * diversification_score + 0.30 * liquidity_score + 0.20 * sharpe_score + 0.20 * resilience_score) * 100.0, 1
    )

    synergy = calculate_digital_traditional_synergy(df, data)

    liquidity_by_tier = df.groupby("liquidityTier")["currentValueUSD"].sum()
    high_liquidity_usd = float(liquidity_by_tier.get("High", 0.0))
    low_liquidity_usd = float(liquidity_by_tier.get("Low", 0.0))
    liquidity_warning = (low_liquidity_usd / total_value) > 0.60

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
# Service: Milestone Liquidity Tracker
# ---------------------------------------------------------------------------

def calculate_milestone_liquidity(request: MilestoneRequest) -> MilestoneLiquidityResponse:
    milestone = MilestoneTarget(
        target_name="HDB Flat Downpayment",
        target_amount=request.target_amount,
        target_date="2026-11-01",
    )

    cash_reserves = 20_000.0
    liquid_investments = {"Equities": 100_000.0, "Bonds": 50_000.0}
    illiquid_investments = {"Private Equity": 200_000.0, "Crypto": 100_000.0}

    snapshot = FinancialSnapshot(
        cpf_oa_balance=request.cpf_oa_balance,
        cash_reserves=cash_reserves,
        liquid_investments=liquid_investments,
        illiquid_investments=illiquid_investments,
        monthly_burn_rate=request.monthly_burn_rate,
    )

    cash_shortfall = request.target_amount - request.cpf_oa_balance
    post_milestone_cash = cash_reserves - cash_shortfall
    runway_months = (
        post_milestone_cash / request.monthly_burn_rate if request.monthly_burn_rate > 0 else float("inf")
    )

    if runway_months < 6.0:
        status = "High Liquidity Risk"
        target_buffer = 6.0 * request.monthly_burn_rate
        liquidation_needed = target_buffer - post_milestone_cash
        top_liquid_source = max(liquid_investments, key=liquid_investments.get)
        top_illiquid_source = max(illiquid_investments, key=illiquid_investments.get)
        recommended_action = (
            f"Liquidate ${liquidation_needed:,.0f} from {top_liquid_source} "
            f"to secure a 6-month post-purchase cash buffer and prevent "
            f"forced sales of illiquid {top_illiquid_source}."
        )
    else:
        status = "Healthy"
        recommended_action = None

    analysis = LiquidityAnalysis(
        cash_shortfall=round(cash_shortfall, 2),
        post_milestone_cash=round(post_milestone_cash, 2),
        runway_months=round(runway_months, 2),
        status=status,
        recommended_action=recommended_action,
    )

    return MilestoneLiquidityResponse(
        milestone=milestone,
        financial_snapshot=snapshot,
        analysis=analysis,
    )


# ---------------------------------------------------------------------------
# Service: Multi-Scenario Planner
# ---------------------------------------------------------------------------

def _is_property_goal(label: str) -> bool:
    return any(kw.lower() in label.lower() for kw in PROPERTY_LABELS)


async def evaluate_scenarios(request: ScenariosRequest) -> ScenariosResponse:
    results: list[ScenarioResult] = []

    for scenario in request.scenarios:
        if scenario.type == "Shock":
            liquid_assets_available = request.cash_reserves
            impact_amount = liquid_assets_available - scenario.target_amount
            status = "Healthy" if impact_amount >= 0 else "At Risk"
        else:
            cpf_contribution = request.cpf_oa_balance if _is_property_goal(scenario.label) else 0.0
            liquid_assets_available = cpf_contribution + request.cash_reserves
            shortfall = scenario.target_amount - liquid_assets_available
            impact_amount = -shortfall
            status = "Healthy" if shortfall <= 0 else "At Risk"

        prompt = (
            "You are a licensed Singaporean financial planner. "
            f"A client faces this scenario: '{scenario.label}' "
            f"(type: {scenario.type}, amount: ${scenario.target_amount:,.0f}). "
            f"Their current cash reserves are ${request.cash_reserves:,.0f}, "
            f"CPF OA balance is ${request.cpf_oa_balance:,.0f}, "
            f"and monthly burn rate is ${request.monthly_burn_rate:,.0f}. "
            f"The computed impact is ${abs(impact_amount):,.0f} "
            f"{'surplus' if impact_amount >= 0 else 'shortfall'}. "
            "Analyze this scenario. If there is a shortfall, suggest a specific "
            "monthly savings target or a reallocation move. "
            "Reply in 2-3 sentences maximum."
        )
        try:
            response = await client.aio.models.generate_content(model="gemini-2.0-flash", contents=prompt)
            recommendation = response.text.strip()
        except Exception:
            _months_runway = round(request.cash_reserves / max(request.monthly_burn_rate, 1))
            if scenario.type == "Shock":
                if status == "At Risk":
                    recommendation = (
                        f"A {scenario.label} event would exhaust your emergency buffer — "
                        f"you currently face a ${abs(impact_amount):,.0f} shortfall against "
                        f"this shock. Build cash reserves to at least "
                        f"${scenario.target_amount * 1.2:,.0f} by directing "
                        f"${round(scenario.target_amount * 0.2 / 12):,.0f}/month into a "
                        f"high-yield savings account or liquid money-market fund."
                    )
                else:
                    recommendation = (
                        f"Your emergency buffer comfortably covers a {scenario.label} event, "
                        f"leaving a ${impact_amount:,.0f} surplus. Your current "
                        f"{_months_runway}-month cash runway is healthy — consider parking "
                        f"the excess in a short-duration T-bill to earn risk-free yield "
                        f"while keeping full liquidity."
                    )
            else:
                if status == "At Risk":
                    _monthly_gap = round(abs(impact_amount) / 12)
                    recommendation = (
                        f"Your {scenario.label} goal has a ${abs(impact_amount):,.0f} funding "
                        f"gap. Redirect approximately ${_monthly_gap:,.0f}/month into a "
                        f"dedicated goal savings account or low-volatility unit trust to close "
                        f"this shortfall before the target milestone date."
                    )
                else:
                    recommendation = (
                        f"Excellent — your liquid assets fully cover the {scenario.label} "
                        f"goal with a ${impact_amount:,.0f} surplus. Maintain your current "
                        f"allocation and review annually to ensure milestone funding stays "
                        f"on track as market conditions evolve."
                    )

        results.append(
            ScenarioResult(
                label=scenario.label,
                type=scenario.type,
                status=status,
                impact_amount=round(impact_amount, 2),
                target_amount=scenario.target_amount,
                liquid_assets_available=round(liquid_assets_available, 2),
                recommendation=recommendation,
            )
        )

    return ScenariosResponse(results=results)

