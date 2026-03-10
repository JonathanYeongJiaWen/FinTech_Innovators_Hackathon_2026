import json
import os
from google import genai
from fastapi import HTTPException

from schemas.advisor_schema import (
    ClientSummary,
    InsightRequest,
    InsightResponse,
    BehavioralInsightsResponse,
    BehavioralProfileResponse,
    CostOfBehaviorResponse,
    AlphaDirection,
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MOCK_CLIENTS: list[dict] = [
    {
        "client_id": "CLI-001",
        "name": "Rachel Tan",
        "net_worth": 2_450_000.00,
        "wellness_score": 82.4,
        "portfolio_summary": {
            "asset_class_1": "Equities",
            "asset_class_1_pct": 55.0,
            "asset_class_2": "Fixed_Income",
            "asset_class_2_pct": 30.0,
        },
        "active_scenarios": [
            {"label": "Buying Condo (Private)", "type": "Goal", "status": "Healthy", "shortfall": 0, "liquid_allocated": 350_000},
            {"label": "Job Loss", "type": "Shock", "status": "Healthy", "shortfall": 0, "liquid_allocated": 120_000},
        ],
    },
    {
        "client_id": "CLI-002",
        "name": "David Ng",
        "net_worth": 870_000.00,
        "wellness_score": 38.7,
        "portfolio_summary": {
            "asset_class_1": "Equities",
            "asset_class_1_pct": 82.0,
            "asset_class_2": "Digital_Assets",
            "asset_class_2_pct": 14.0,
        },
        "active_scenarios": [
            {"label": "Buying Property (HDB)", "type": "Goal", "status": "At Risk", "shortfall": 20_000, "liquid_allocated": 80_000},
            {"label": "Job Loss", "type": "Shock", "status": "Healthy", "shortfall": 0, "liquid_allocated": 50_000},
        ],
    },
    {
        "client_id": "CLI-003",
        "name": "Aisha Binte Rahman",
        "net_worth": 5_120_000.00,
        "wellness_score": 74.1,
        "portfolio_summary": {
            "asset_class_1": "Real_Estate",
            "asset_class_1_pct": 40.0,
            "asset_class_2": "Fixed_Income",
            "asset_class_2_pct": 35.0,
        },
        "active_scenarios": [
            {"label": "Children's Education Fund", "type": "Goal", "status": "Healthy", "shortfall": 0, "liquid_allocated": 200_000},
        ],
    },
    {
        "client_id": "CLI-004",
        "name": "Marcus Lee",
        "net_worth": 1_680_000.00,
        "wellness_score": 65.9,
        "portfolio_summary": {
            "asset_class_1": "Equities",
            "asset_class_1_pct": 45.0,
            "asset_class_2": "Private_Equity",
            "asset_class_2_pct": 25.0,
        },
        "active_scenarios": [
            {"label": "Medical Emergency", "type": "Shock", "status": "At Risk", "shortfall": 15_000, "liquid_allocated": 35_000},
            {"label": "Buying Property (HDB)", "type": "Goal", "status": "Healthy", "shortfall": 0, "liquid_allocated": 110_000},
        ],
    },
]

_BEHAVIORAL_DATA: dict[str, dict] = {
    "CLI-001": {
        "profile": {"lossAversion": 42, "overconfidence": 55, "herdMentality": 30, "dispositionEffect": 48},
        "cost": {
            "actualPortfolioValue": 2_450_000.00,
            "ghostPortfolioValue": 2_410_000.00,
            "behavioralAlpha": 40_000.00,
            "alphaDirection": AlphaDirection.PREVENTED_LOSSES,
        },
    },
    "CLI-002": {
        "profile": {"lossAversion": 78, "overconfidence": 80, "herdMentality": 72, "dispositionEffect": 85},
        "cost": {
            "actualPortfolioValue": 870_000.00,
            "ghostPortfolioValue": 1_042_000.00,
            "behavioralAlpha": -172_000.00,
            "alphaDirection": AlphaDirection.MISSED_GAINS,
        },
    },
    "CLI-003": {
        "profile": {"lossAversion": 35, "overconfidence": 40, "herdMentality": 22, "dispositionEffect": 38},
        "cost": {
            "actualPortfolioValue": 5_120_000.00,
            "ghostPortfolioValue": 5_090_000.00,
            "behavioralAlpha": 30_000.00,
            "alphaDirection": AlphaDirection.PREVENTED_LOSSES,
        },
    },
    "CLI-004": {
        "profile": {"lossAversion": 62, "overconfidence": 45, "herdMentality": 38, "dispositionEffect": 71},
        "cost": {
            "actualPortfolioValue": 1_042_350.00,
            "ghostPortfolioValue": 1_087_920.00,
            "behavioralAlpha": -45_570.00,
            "alphaDirection": AlphaDirection.MISSED_GAINS,
        },
    },
}


def get_advisor_clients() -> list[ClientSummary]:
    return [ClientSummary(**c) for c in MOCK_CLIENTS]


async def generate_advisor_insight(request: InsightRequest) -> InsightResponse:
    at_risk_scenarios = [s for s in request.active_scenarios if s.status == "At Risk"]
    scenario_text = ""
    if at_risk_scenarios:
        scenario_lines = [
            f"  - '{s.label}' ({s.type}): shortfall ${s.shortfall:,.0f}, "
            f"liquid allocated ${s.liquid_allocated:,.0f}"
            for s in at_risk_scenarios
        ]
        scenario_text = "\n\nThe client has the following 'At Risk' scenarios:\n" + "\n".join(scenario_lines)

    prompt = (
        "You are an elite quantitative wealth advisor. "
        "A client has the following portfolio breakdown:\n"
        f"- {request.portfolio_summary.asset_class_1}: {request.portfolio_summary.asset_class_1_pct}%\n"
        f"- {request.portfolio_summary.asset_class_2}: {request.portfolio_summary.asset_class_2_pct}%\n"
        f"- Remaining: other asset classes\n"
        f"- Current Wellness Score: {request.wellness_score}/100"
        f"{scenario_text}\n\n"
        "Analyze the client's portfolio against their 'At Risk' scenarios. "
        "Generate a recommended_action specifically designed to fix the exact "
        "shortfall using their current liquid assets and portfolio weighting. "
        "If there are no at-risk scenarios, focus on the single biggest "
        "vulnerability and suggest a concrete rebalancing move.\n\n"
        "You MUST respond with ONLY a valid JSON object with exactly two string fields:\n"
        '  "primary_risk": a concise description of the biggest risk,\n'
        '  "recommended_action": a specific rebalancing instruction referencing percentages and target instruments.\n\n'
        "Do not include any text outside the JSON object."
    )

    try:
        response = await client.aio.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        raw = response.text.strip()
    except Exception:
        _ac1 = request.portfolio_summary.asset_class_1
        _ac1_pct = request.portfolio_summary.asset_class_1_pct
        _ac2 = request.portfolio_summary.asset_class_2
        _ac2_pct = request.portfolio_summary.asset_class_2_pct
        _ws = request.wellness_score
        if at_risk_scenarios:
            _worst = max(at_risk_scenarios, key=lambda _s: _s.shortfall)
            _fallback_risk = (
                f"{_worst.label} is flagged 'At Risk' with a ${_worst.shortfall:,.0f} "
                f"funding shortfall, compounded by heavy {_ac1} concentration "
                f"({_ac1_pct:.0f}% of AUM) and a wellness score of {_ws:.0f}/100."
            )
            _trim_pct = min(round(_ac1_pct * 0.15), 15)
            _fallback_action = (
                f"Liquidate {_trim_pct}% of {_ac1} holdings and redirect "
                f"${_worst.shortfall:,.0f} into a high-yield liquid cash account "
                f"earmarked for the {_worst.label} shortfall; review remaining "
                f"{_ac2} ({_ac2_pct:.0f}%) allocation quarterly."
            )
        else:
            _heavy = _ac1 if _ac1_pct >= _ac2_pct else _ac2
            _heavy_pct = _ac1_pct if _ac1_pct >= _ac2_pct else _ac2_pct
            _fallback_risk = (
                f"No immediate at-risk scenarios \u2014 however {_heavy} represents "
                f"{_heavy_pct:.0f}% of AUM, a concentration risk if sector "
                f"conditions deteriorate. Wellness score: {_ws:.0f}/100."
            )
            _fallback_action = (
                f"Trim {_heavy} by 10% and rotate proceeds into diversified "
                f"global fixed-income or a multi-asset fund to reduce single-class "
                f"concentration and improve portfolio resilience."
            )
        return InsightResponse(primary_risk=_fallback_risk, recommended_action=_fallback_action)

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3].strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Gemini returned non-JSON response.")

    if "primary_risk" not in parsed or "recommended_action" not in parsed:
        raise HTTPException(status_code=502, detail="Gemini response missing required fields.")

    return InsightResponse(
        primary_risk=str(parsed["primary_risk"]),
        recommended_action=str(parsed["recommended_action"]),
    )


def get_behavioral_insights(client_id: str) -> BehavioralInsightsResponse:
    data = _BEHAVIORAL_DATA.get(client_id)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"No behavioral data found for client '{client_id}'.",
        )
    return BehavioralInsightsResponse(
        behavioralProfile=BehavioralProfileResponse(**data["profile"]),
        costOfBehavior=CostOfBehaviorResponse(**data["cost"]),
    )
