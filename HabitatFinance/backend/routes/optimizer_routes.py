from fastapi import APIRouter
from schemas.optimizer_schema import OptimizeRequest, OptimizeResponse
from services.optimizer_service import optimize_portfolio_service

router = APIRouter(tags=["Portfolio Optimizer"])


@router.post("/api/v1/optimize-portfolio", response_model=OptimizeResponse)
async def optimize_portfolio(request: OptimizeRequest) -> OptimizeResponse:
    return await optimize_portfolio_service(request)
