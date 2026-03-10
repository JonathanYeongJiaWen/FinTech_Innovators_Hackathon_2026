
import logging
from pathlib import Path

import numpy as np
import pandas as pd
import requests
import yfinance as yf
from fastapi import HTTPException
from scipy.optimize import minimize

from schemas.optimizer_schema import (
    AssetRecommendation,
    OptimizeRequest,
    OptimizeResponse,
)
from services.llm_service import generate_trade_rationales

logger = logging.getLogger(__name__)

RISK_FREE_RATE = 0.03
FALLBACK_DATA_PATH = Path(__file__).parent.parent / "fallback_market_data.json"

# Standard Chrome User-Agent header — helps avoid Yahoo Finance IP rate-limits
_CHROME_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)


def _fetch_market_data(tickers: list[str]) -> tuple[pd.DataFrame, bool]:
    """Download one year of daily Close prices for *tickers*.

    Returns ``(prices_df, is_live_data)`` where ``is_live_data=True`` means
    data came from Yahoo Finance and ``False`` means the local fallback file
    ``fallback_market_data.json`` was used instead.
    """
    # --- Anti-blocker: Chrome session ---
    session = requests.Session()
    session.headers.update({"User-Agent": _CHROME_UA})

    try:
        raw = yf.download(
            tickers,
            period="1y",
            auto_adjust=True,
            progress=False,
            session=session,
            timeout=15,
        )
        prices: pd.DataFrame = raw["Close"] if "Close" in raw.columns.get_level_values(0) else raw

        # Normalise single-ticker result (Series → DataFrame)
        if isinstance(prices, pd.Series):
            prices = prices.to_frame(name=tickers[0])

        if prices is None or prices.empty:
            raise ValueError("yfinance returned empty data — IP may be rate-limited")

        logger.info("yfinance: fetched %d rows for %s", len(prices), tickers)
        return prices, True

    except Exception as exc:
        logger.warning(
            "yfinance live fetch failed (%s). Loading static fallback: %s",
            exc,
            FALLBACK_DATA_PATH,
        )

    # --- Static fallback ---
    try:
        prices = pd.read_json(FALLBACK_DATA_PATH)
        available = [t for t in tickers if t in prices.columns]
        if not available:
            raise ValueError(
                f"None of the requested tickers {tickers} are present in "
                f"{FALLBACK_DATA_PATH.name} (available: {list(prices.columns)})"
            )
        return prices[available], False
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Market data unavailable: live fetch failed and fallback file "
                f"could not be read ({exc})."
            ),
        ) from exc


def optimize_portfolio_service(request: OptimizeRequest) -> OptimizeResponse:
    n = len(request.asset_names)

    # --- Input validation ---
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
    # --- Live market data override ---
    # When the caller supplies ticker symbols we fetch real historical prices,
    # compute annualised expected returns and the covariance matrix from them,
    # and replace the caller-provided values.  The fallback path loads a local
    # JSON snapshot so the maths never crashes due to an empty yfinance result.
    is_live_data: bool = True
    if request.tickers and len(request.tickers) == n:
        prices, is_live_data = _fetch_market_data(request.tickers)
        daily_returns = prices.pct_change().dropna()
        # Only substitute if we actually got returns for every requested ticker
        if not daily_returns.empty and set(request.tickers).issubset(daily_returns.columns):
            ordered = daily_returns[list(request.tickers)]
            mu = (ordered.mean() * 252).values          # annualised expected return
            cov = (ordered.cov() * 252).values          # annualised covariance

    np.fill_diagonal(cov, cov.diagonal() + 1e-6)

    def neg_sharpe(weights: np.ndarray) -> float:
        port_return = float(weights @ mu)
        port_vol = float(np.sqrt(max(0.0, weights @ cov @ weights)))
        return -((port_return - RISK_FREE_RATE) / (port_vol + 1e-8))

    constraints = ({"type": "eq", "fun": lambda w: np.sum(w) - 1.0})
    bounds = [(0.0, 1.0)] * n
    initial_weights = np.array(request.current_weights)

    if abs(initial_weights.sum() - 1.0) > 0.05:
        initial_weights = np.ones(n) / n

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
        opt_weights = np.array(request.current_weights)
        projected_sharpe = float(-neg_sharpe(opt_weights))

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

    # --- Explainable AI: attach LLM-generated rationales ---
    rationales = generate_trade_rationales(recommendations, projected_sharpe)
    for rec in recommendations:
        rec.rationale = rationales.get(rec.asset, "")

    return OptimizeResponse(
        optimizedWeights=optimized_weights,
        projectedSharpeRatio=round(projected_sharpe, 6),
        recommendations=recommendations,
        is_live_data=is_live_data,
    )
