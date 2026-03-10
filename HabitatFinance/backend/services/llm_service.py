import concurrent.futures
import json
import logging
import os

from google import genai
from google.genai import types

from schemas.optimizer_schema import AssetRecommendation

logger = logging.getLogger(__name__)

_RATIONALE_TIMEOUT_SECONDS = 15

_SYSTEM_PROMPT_TEMPLATE = (
    "You are a quantitative wealth advisor explaining a Mean-Variance Optimization "
    "output to a client. The portfolio's projected Sharpe ratio is now {projected_sharpe:.4f}. "
    "For the provided list of trades, generate a 1-2 sentence rationale for each. "
    "Focus on concepts like sector concentration, portfolio variance, risk-adjusted returns, "
    "and the Efficient Frontier. "
    "Return ONLY a valid JSON object where the keys are the asset names and the values are "
    "the rationale strings."
)


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "No Gemini API key found. Set the GEMINI_API_KEY environment variable."
        )
    return genai.Client(api_key=api_key)


def _fallback_rationales(recommendations: list[AssetRecommendation]) -> dict[str, str]:
    return {
        rec.asset: "Quantitative optimisation complete. AI rationale is currently unavailable."
        for rec in recommendations
    }


def generate_trade_rationales(
    recommendations: list[AssetRecommendation],
    projected_sharpe: float,
) -> dict[str, str]:
    """Call the Gemini LLM to produce a rationale string for each asset.

    Returns a dict mapping asset name -> rationale string.
    Falls back to empty strings on any error so the optimizer response is
    never blocked by an LLM failure.
    """
    if not recommendations:
        return {}

    try:
        client = _get_client()
    except EnvironmentError as exc:
        logger.warning("LLM rationale skipped: %s", exc)
        return _fallback_rationales(recommendations)

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
    user_message = json.dumps(trade_payload, indent=2)

    def _call_llm() -> str:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                temperature=0.4,
            ),
        )
        return response.text.strip()

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_call_llm)
            raw = future.result(timeout=_RATIONALE_TIMEOUT_SECONDS)

        # Strip markdown code fences if the model adds them despite the MIME hint
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        rationales: dict = json.loads(raw)
        return {str(k): str(v) for k, v in rationales.items()}

    except concurrent.futures.TimeoutError:
        logger.warning("LLM rationale generation timed out after %ds", _RATIONALE_TIMEOUT_SECONDS)
        return _fallback_rationales(recommendations)
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM rationale generation failed: %s", exc)
        return _fallback_rationales(recommendations)
