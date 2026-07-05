from fastapi import APIRouter

from app.schemas.market import IndexSummary
from app.services.market_service import market_service

router = APIRouter()


@router.get("/", response_model=list[IndexSummary])
async def list_indices():
    return await market_service.get_indices()
