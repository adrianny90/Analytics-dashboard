from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1.ws import router as ws_router
from app.core.config import settings
from app.services.index_ranking_service import RANKING_SERVICES
from app.services.market_service import market_service
from app.services.watchlist_repo import list_custom_tickers


@asynccontextmanager
async def lifespan(app: FastAPI):
    for ticker in await list_custom_tickers():
        market_service.track_custom_watchlist_symbol(ticker.symbol)
    await market_service.start()
    for service in RANKING_SERVICES.values():
        await service.restore()
    yield
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
