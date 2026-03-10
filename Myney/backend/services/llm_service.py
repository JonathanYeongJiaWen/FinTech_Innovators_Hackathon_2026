import json
import logging
import os
import re

from google import genai

from schemas.optimizer_schema import AssetRecommendation

logger = logging.getLogger(__name__)

_MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b"]
_MAX_RPM_WAIT = 30.0

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

_SYSTEM_PROMPT_TEMPLATE = (
    "You are a quantitative wealth advisor explaining a Mean-Variance Optimization "
    "output to a client. The portfolio's projected Sharpe ratio is now {projected_sharpe:.4f}. "
    "For the provided list of trades, generate a 1-2 sentence rationale for each. "
    "Focus on concepts like sector concentration, portfolio variance, risk-adjusted returns, "
    "and the Efficient Frontier. "
    "Return ONLY a valid JSON object where the keys are the asset names and the values are "
    "the rationale strings."
)


def _rule_based_rationale(rec: AssetRecommendation, projected_sharpe: float) -> str:
    """Generate a deterministic but financially meaningful rationale from optimizer output."""
    name = rec.asset
    cur = rec.currentWeight
    opt = rec.optimizedWeight
    diff = opt - cur
    diff_pct = abs(diff) * 100

    if rec.action.startswith("Buy"):
        if opt > 0.20:
            return (
                f"The optimizer raised {name}'s allocation by {diff_pct:.1f}% to {opt*100:.1f}%, "
                f"as its risk-adjusted return profile improves the portfolio's position on the "
                f"Efficient Frontier and lifts the projected Sharpe ratio to {projected_sharpe:.2f}."
            )
        return (
            f"Increasing {name} by {diff_pct:.1f}% reduces overall portfolio variance through "
            f"diversification, contributing to the {projected_sharpe:.2f} projected Sharpe ratio "
            f"without meaningfully raising concentration risk."
        )
    elif rec.action.startswith("Sell"):
        if cur > 0.25:
            return (
                f"{name}'s current weight of {cur*100:.1f}% creates sector concentration risk; "
                f"trimming by {diff_pct:.1f}% to {opt*100:.1f}% lowers covariance drag and "
                f"shifts the portfolio closer to the mean-variance optimal frontier."
            )
        return (
            f"Reducing {name} by {diff_pct:.1f}% improves the portfolio's risk-adjusted return "
            f"by reallocating capital to assets with a better expected return per unit of volatility, "
            f"targeting a Sharpe ratio of {projected_sharpe:.2f}."
        )
    else:
        return (
            f"{name}'s current weight of {cur*100:.1f}% is already near the mean-variance optimal "
            f"allocation; no rebalancing is required to maintain the {projected_sharpe:.2f} "
            f"projected Sharpe ratio."
        )


def _fallback_rationales(
    recommendations: list[AssetRecommendation],
    projected_sharpe: float = 0.0,
) -> dict[str, str]:
    for rec in recommendations:
        rec.rationale_source = "rule_based"
    return {rec.asset: _rule_based_rationale(rec, projected_sharpe) for rec in recommendations}


def _parse_rpm_delay(exc_str: str) -> float | None:
    """Return retry delay if it's a per-minute limit (≤30 s), else None."""
    m = re.search(r"retryDelay[^0-9]+(\d+(?:\.\d+)?)s", exc_str)
    if m:
        delay = float(m.group(1))
        return delay if delay <= _MAX_RPM_WAIT else None
    return None


async def generate_trade_rationales(
    recommendations: list[AssetRecommendation],
    projected_sharpe: float,
) -> dict[str, str]:
    """Async Gemini call — mirrors stress_test_service pattern exactly."""
    if not recommendations:
        return {}

    if not os.getenv("GEMINI_API_KEY"):
        logger.warning("LLM rationale skipped: GEMINI_API_KEY not set")
        return _fallback_rationales(recommendations, projected_sharpe)

    system_prompt = _SYSTEM_PROMPT_TEMPLATE.format(projected_sharpe=projected_sharpe)
    trade_payload = [
        {
            "asset": rec.asset,
            "currentWeight": rec.currentWeight,
            "optimizedWeight": rec.optimizedWeight,
            "action": rec.action,
        }
        for rec in recommendations
    ]
    prompt = f"{system_prompt}\n\n{json.dumps(trade_payload, indent=2)}"

    import asyncio

    for model in _MODELS_TO_TRY:
        for attempt in range(2):
            try:
                response = await client.aio.models.generate_content(
                    model=model, contents=prompt
                )
                raw = response.text.strip()
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                    raw = raw.strip()
                rationales: dict = json.loads(raw)
                return {str(k): str(v) for k, v in rationales.items()}
            except Exception as exc:
                exc_str = str(exc)
                if "429" not in exc_str and "RESOURCE_EXHAUSTED" not in exc_str:
                    logger.warning("LLM unexpected error: %s", exc_str[:200])
                    return _fallback_rationales(recommendations, projected_sharpe)
                if attempt == 0:
                    delay = _parse_rpm_delay(exc_str)
                    if delay is not None:
                        logger.info("RPM limit on %s, retrying after %.1fs", model, delay)
                        await asyncio.sleep(delay + 0.5)
                        continue
                logger.warning("Model %s quota exhausted, trying next.", model)
                break  # move to next model

    logger.warning("All models exhausted quota, returning fallback.")
    return _fallback_rationales(recommendations, projected_sharpe)
