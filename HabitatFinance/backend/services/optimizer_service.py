
import numpy as np
from scipy.optimize import minimize
from fastapi import HTTPException

from schemas.optimizer_schema import (
    OptimizeRequest,
    OptimizeResponse,
    AssetRecommendation,
)

RISK_FREE_RATE = 0.03


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

    # Tikhonov regularisation
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

    return OptimizeResponse(
        optimizedWeights=optimized_weights,
        projectedSharpeRatio=round(projected_sharpe, 6),
        recommendations=recommendations,
    )
