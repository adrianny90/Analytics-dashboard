import asyncio
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1.ws import router as ws_router
from app.core.config import settings
from app.services.index_ranking_service import RANKING_SERVICES
from app.services.kitchin_service import kitchin_service
from app.services.market_service import market_service
from app.services.watchlist_repo import list_custom_tickers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Every yfinance/pandas call goes through asyncio.to_thread, i.e. this
    # loop's default ThreadPoolExecutor - each worker thread gets its own
    # glibc malloc arena, and release_memory()'s malloc_trim(0) only reclaims
    # the *main* arena, not those. Capping worker threads keeps the number of
    # arenas (and how much memory can hide, unreclaimed, in fragmented ones)
    # small. Pair with the MALLOC_ARENA_MAX=1 env var on Render for the fix
    # to actually take effect.
    asyncio.get_running_loop().set_default_executor(ThreadPoolExecutor(max_workers=4))
    for ticker in await list_custom_tickers():
        market_service.track_custom_watchlist_symbol(ticker.symbol)
    await market_service.start()
    for service in RANKING_SERVICES.values():
        await service.restore()
        service.start_scheduler()
    await kitchin_service.restore()
    kitchin_service.start_scheduler()
    yield
    for service in RANKING_SERVICES.values():
        await service.stop_scheduler()
    await kitchin_service.stop_scheduler()
    await market_service.stop()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(ws_router, prefix="/ws")


@app.get("/health")
async def health():
    return {"status": "ok"}
