import json
import numpy as np
import pandas as pd
from pathlib import Path
from fastapi import HTTPException
from google import genai
import os

from schemas.stress_test_schema import (
    ScenarioRequest,
    ScenarioResponse,
    VALID_SCENARIOS,
    SCENARIO_NAMES,
)

DATA_PATH = Path(__file__).parent.parent / "mock_database.json"
RISK_FREE_RATE = 0.03
SHARPE_MAX = 1.5
LIQUID_ASSET_CLASSES = {"Cash", "Equities"}
ILLIQUID_REAL_ASSET_INDICATORS = {"Real Estate", "HDB", "Private_Equity"}

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def _compute_wellness_score(df: pd.DataFrame, value_col: str) -> tuple[float, float]:
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
    wellness = min(max(sharpe / SHARPE_MAX * 100.0, 0.0), 100.0)

    if "beta" in df.columns:
        port_beta = float(np.dot(weight, df["beta"]))
        if port_beta > 1.2 or port_beta < 0.5:
            wellness *= 0.90

    liquid_mask = df["assetClass"].isin(LIQUID_ASSET_CLASSES)
    liquid_weight = float(weight[liquid_mask].sum())
    has_illiquid_real_assets = (
        df["assetClass"].isin(ILLIQUID_REAL_ASSET_INDICATORS).any()
        or df.get("sector", pd.Series(dtype=str)).isin(ILLIQUID_REAL_ASSET_INDICATORS).any()
    )
    if liquid_weight < 0.15 and has_illiquid_real_assets:
        wellness -= 15.0

    wellness = round(min(max(wellness, 0.0), 100.0), 1)
    return sharpe, wellness


async def run_stress_test(request: ScenarioRequest) -> ScenarioResponse:
    if request.scenario_id not in VALID_SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario_id '{request.scenario_id}'. Must be one of: {sorted(VALID_SCENARIOS)}.",
        )

    try:
        with open(DATA_PATH, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio data file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Portfolio data file contains invalid JSON.")

    data = data.get("_legacy", data)

    records = [
        {
            "name":                 asset["name"],
            "assetClass":           asset["assetClass"],
            "sector":               asset["sector"],
            "currentValueUSD":      asset["currentValueUSD"],
            "liquidityTier":        asset["liquidityTier"],
            "expectedReturn":       asset["riskMetrics"]["expectedReturn"],
            "historicalVolatility": asset["riskMetrics"]["historicalVolatility"],
            "beta":                 asset["riskMetrics"].get("beta", 1.0),
        }
        for asset in data["assets"]
    ]
    df = pd.DataFrame(records)

    original_total = float(df["currentValueUSD"].sum())
    _, original_wellness = _compute_wellness_score(df, "currentValueUSD")

    s = request.severity_multiplier
    shocked = df["currentValueUSD"].copy()

    if request.scenario_id == "TECH_CRASH":
        tech_equity_mask = (df["sector"] == "Technology") & (df["assetClass"] == "Equities")
        other_equity_mask = (df["sector"] != "Technology") & (df["assetClass"] == "Equities")
        shocked[tech_equity_mask] *= (1.0 - 0.30 * s)
        shocked[other_equity_mask] *= (1.0 - 0.10 * s)
    elif request.scenario_id == "FED_RATE_HIKE":
        equity_mask = df["assetClass"] == "Equities"
        fi_mask = df["assetClass"] == "Fixed_Income"
        shocked[equity_mask] *= (1.0 - 0.15 * s)
        shocked[fi_mask] *= (1.0 - 0.05 * s)

    df["shockedValueUSD"] = shocked
    projected_total = float(df["shockedValueUSD"].sum())
    net_change_usd = round(projected_total - original_total, 2)
    _, projected_wellness = _compute_wellness_score(df, "shockedValueUSD")

    df["pct_change"] = (df["shockedValueUSD"] - df["currentValueUSD"]) / df["currentValueUSD"]
    worst_asset_name = str(df.loc[df["pct_change"].idxmin(), "name"])

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

    try:
        response = await client.aio.models.generate_content(model="gemini-1.5-flash", contents=prompt)
        ai_analysis = response.text
    except Exception:
        _stress_fallbacks: dict[str, str] = {
            "TECH_CRASH": (
                f"A technology sector crash compressed growth-oriented equities across your "
                f"portfolio, with {worst_asset_name} recording the steepest decline and "
                f"driving a ${abs(net_change_usd):,.0f} total reduction in net worth. "
                f"Capping sector concentration below 25% of AUM and diversifying into "
                f"defensive sectors such as healthcare and consumer staples would meaningfully "
                f"reduce your portfolio's sensitivity to single-sector drawdowns."
            ),
            "FED_RATE_HIKE": (
                f"Rising rates simultaneously pressured equities and marked fixed-income "
                f"instruments to market, producing a ${abs(net_change_usd):,.0f} net decline "
                f"with {worst_asset_name} most exposed to duration risk. Rotating "
                f"long-duration bonds into floating-rate notes or 1-3 year T-bills would "
                f"materially reduce your portfolio's interest-rate sensitivity going forward."
            ),
        }
        ai_analysis = _stress_fallbacks.get(
            request.scenario_id,
            (
                f"The '{scenario_name}' scenario produced a ${abs(net_change_usd):,.0f} "
                f"shift in portfolio value, with '{worst_asset_name}' as the most exposed "
                f"position. Reviewing concentration limits and maintaining at least 6 months "
                f"of liquid reserves will help buffer against similar macro shocks."
            ),
        )

    return ScenarioResponse(
        scenarioName=scenario_name,
        originalNetWorthUSD=round(original_total, 2),
        projectedNetWorthUSD=round(projected_total, 2),
        netChangeUSD=net_change_usd,
        originalWellnessScore=original_wellness,
        projectedWellnessScore=projected_wellness,
        aiAnalysis=ai_analysis,
    )

