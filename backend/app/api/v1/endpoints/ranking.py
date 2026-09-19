from enum import Enum

from fastapi import APIRouter, HTTPException

from app.schemas.market import DownloadAllStatus, PeriodChange, RankingEntry, RankingStatus, RsiScanStatus, Timeframe
from app.services.index_ranking_service import RANKING_SERVICES, download_all_service

router = APIRouter()


class Universe(str, Enum):
    SP500 = "sp500"
    NASDAQ = "nasdaq"
    RUSSELL2000 = "russell2000"


class ChangePeriod(str, Enum):
    DAY = "1d"
    WEEK = "1w"
    MONTH = "1m"
    HALF_YEAR = "6m"
    YEAR = "1y"


# "/all/..." must be declared before the "/{universe}/..." routes below, or
# "all" would be matched (and rejected) as a universe name.
@router.post("/all/start", response_model=DownloadAllStatus)
async def start_download_all():
    """Runs the full download for S&P 500, then Nasdaq, then Russell 2000
    (skipping any whose last full run is still inside the cache window).
    Returns immediately - poll /all/status for progress."""
    return download_all_service.start()


@router.get("/all/status", response_model=DownloadAllStatus)
async def get_download_all_status():
    return download_all_service.get_status()


@router.post("/{universe}/start", response_model=RankingStatus)
async def start_ranking(universe: Universe):
    """Kicks off the background scan for this universe (no-op if one is
    already running). Returns immediately - poll /status for progress and
    / for the finished result."""
    return RANKING_SERVICES[universe.value].start()


@router.post("/{universe}/rsi-scan", response_model=RsiScanStatus)
async def start_rsi_scan(universe: Universe, timeframe: Timeframe = Timeframe.DAY):
    """Computes RSI(14) for every symbol on one timeframe (reusing values that
    are still fresh) so the RSI filter can be applied. Poll /rsi-scan/status."""
    try:
        return RANKING_SERVICES[universe.value].start_rsi_scan(timeframe)
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/{universe}/rsi-scan/status", response_model=RsiScanStatus)
async def get_rsi_scan_status(universe: Universe):
    return RANKING_SERVICES[universe.value].get_rsi_status()


@router.get("/{universe}/status", response_model=RankingStatus)
async def get_ranking_status(universe: Universe):
    return RANKING_SERVICES[universe.value].get_status()


@router.get("/{universe}/changes", response_model=dict[str, PeriodChange])
async def get_ranking_changes(universe: Universe, period: ChangePeriod = ChangePeriod.DAY):
    """Price change (value and %) per symbol over the chosen period, fetched
    on demand under the same Yahoo throttling as the scan."""
    return await RANKING_SERVICES[universe.value].get_changes(period.value)


@router.get("/{universe}/", response_model=list[RankingEntry])
async def get_ranking(universe: Universe):
    """The last completed full ranking for this universe, persisted in
    Postgres - empty until a scan has finished at least once."""
    return RANKING_SERVICES[universe.value].get_ranking()
