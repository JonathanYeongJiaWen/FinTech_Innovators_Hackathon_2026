from fastapi import APIRouter

from schemas.advisor_schema import (
    ClientSummary,
    InsightRequest,
    InsightResponse,
    BehavioralInsightsResponse,
)
from services.advisor_service import (
    get_advisor_clients,
    generate_advisor_insight,
    get_behavioral_insights,
)

router = APIRouter(tags=["Advisor View"])


@router.get("/api/v1/advisor/clients", response_model=list[ClientSummary])
def advisor_clients() -> list[ClientSummary]:
    return get_advisor_clients()


@router.post("/api/v1/advisor/generate-insight", response_model=InsightResponse)
async def advisor_insight(request: InsightRequest) -> InsightResponse:
    return await generate_advisor_insight(request)


@router.get(
    "/api/v1/advisor/clients/{client_id}/behavioral-insights",
    response_model=BehavioralInsightsResponse,
)
def behavioral_insights(client_id: str) -> BehavioralInsightsResponse:
    return get_behavioral_insights(client_id)
