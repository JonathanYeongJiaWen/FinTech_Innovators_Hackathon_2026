from fastapi import APIRouter

from schemas.stress_test_schema import ScenarioRequest, ScenarioResponse
from services.stress_test_service import run_stress_test

router = APIRouter(tags=["Feature 4: Macro Stress-Tester"])


@router.post("/api/v1/stress-test", response_model=ScenarioResponse)
async def stress_test(request: ScenarioRequest) -> ScenarioResponse:
    return await run_stress_test(request)

