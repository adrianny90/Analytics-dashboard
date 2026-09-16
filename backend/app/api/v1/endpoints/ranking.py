from enum import Enum

from fastapi import APIRouter

from app.schemas.market import RankingEntry, RankingStatus
from app.services.index_ranking_service import RANKING_SERVICES

router = APIRouter()


class Universe(str, Enum):
    SP500 = "sp500"
    NASDAQ = "nasdaq"
    RUSSELL2000 = "russell2000"


@router.post("/{universe}/start", response_model=RankingStatus)
async def start_ranking(universe: Universe):
    """Kicks off the background scan for this universe (no-op if one is
    already running). Returns immediately - poll /status for progress and
    / for the finished result."""
    return RANKING_SERVICES[universe.value].start()


@router.get("/{universe}/status", response_model=RankingStatus)
async def get_ranking_status(universe: Universe):
    return RANKING_SERVICES[universe.value].get_status()


@router.get("/{universe}/", response_model=list[RankingEntry])
async def get_ranking(universe: Universe):
    """The last completed full ranking for this universe, persisted in
    Postgres - empty until a scan has finished at least once."""
    return RANKING_SERVICES[universe.value].get_ranking()
