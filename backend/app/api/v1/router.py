from fastapi import APIRouter

from app.api.v1.endpoints import favorites, history, ichimoku, indices, kitchin, quotes, ranking, watchlist

api_router = APIRouter()
api_router.include_router(indices.router, prefix="/indices", tags=["indices"])
api_router.include_router(quotes.router, prefix="/quotes", tags=["quotes"])
api_router.include_router(history.router, prefix="/history", tags=["history"])
api_router.include_router(watchlist.router, prefix="/watchlist", tags=["watchlist"])
api_router.include_router(ichimoku.router, prefix="/ichimoku", tags=["ichimoku"])
api_router.include_router(ranking.router, prefix="/ranking", tags=["ranking"])
api_router.include_router(kitchin.router, prefix="/kitchin", tags=["kitchin"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["favorites"])
