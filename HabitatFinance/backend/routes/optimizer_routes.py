from fastapi import APIRouter
from models.optimizer_models import OptimizeRequest, OptimizeResponse
from services.optimizer_service import optimize_portfolio_service

router = APIRouter()

@router.post("/api/v1/optimize-portfolio", response_model=OptimizeResponse)
def optimize_portfolio(request: OptimizeRequest) -> OptimizeResponse:
    return optimize_portfolio_service(request)
