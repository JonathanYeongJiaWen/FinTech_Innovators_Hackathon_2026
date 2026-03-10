from fastapi import APIRouter

from schemas.wellness_schema import (
    WellnessResponse,
    MilestoneRequest,
    MilestoneLiquidityResponse,
    ScenariosRequest,
    ScenariosResponse,
    CoachingNudgeRequest,
    CoachingNudgeResponse,
)
from services.wellness_service import (
    get_financial_wellness,
    calculate_milestone_liquidity,
    evaluate_scenarios,
    generate_coaching_nudge,
)

router = APIRouter(tags=["Feature 2: Financial Wellness Engine"])


@router.get("/api/v1/wellness", response_model=WellnessResponse)
def wellness() -> WellnessResponse:
    return get_financial_wellness()


@router.post("/api/v1/wellness/milestone-liquidity", response_model=MilestoneLiquidityResponse)
def milestone_liquidity(request: MilestoneRequest) -> MilestoneLiquidityResponse:
    return calculate_milestone_liquidity(request)


@router.post("/api/v1/wellness/scenarios", response_model=ScenariosResponse)
async def scenarios(request: ScenariosRequest) -> ScenariosResponse:
    return await evaluate_scenarios(request)


@router.post("/api/v1/wellness/coaching-nudge", response_model=CoachingNudgeResponse)
async def coaching_nudge(request: CoachingNudgeRequest) -> CoachingNudgeResponse:
    return await generate_coaching_nudge(request)

