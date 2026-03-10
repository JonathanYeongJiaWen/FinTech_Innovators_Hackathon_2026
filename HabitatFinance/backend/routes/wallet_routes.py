from fastapi import APIRouter, Depends, HTTPException, status

from controllers.wallet_controller import get_aggregated_wallet
from services.auth_service import verify_jwt_token

router = APIRouter(prefix="/api/v1", tags=["Wallet"])


@router.get(
    "/wallet/{user_id}",
    summary="Get unified portfolio for a user",
    description=(
        "Aggregates holdings from Traditional Finance (live prices via yfinance), "
        "Web3 / Ethereum (mock Etherscan), and Private Assets (mock database). "
        "Requires a valid Bearer JWT in the Authorization header."
    ),
    dependencies=[Depends(verify_jwt_token)],
)
def get_wallet(user_id: str) -> dict:
    """
    Returns the aggregated portfolio wallet for *user_id*.

    **Authentication**: Bearer JWT required.  
    Obtain a token via your auth provider and pass it as:  
    `Authorization: Bearer <token>`

    **Path parameter**  
    - `user_id`: client identifier (e.g. `client_001`)
    """
    result = get_aggregated_wallet(user_id)
    if result["asset_count"] == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No holdings found for user_id='{user_id}'. "
                   "Ensure the ID matches a record in the database.",
        )
    return result

