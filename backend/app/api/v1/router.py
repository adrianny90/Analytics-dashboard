from fastapi import APIRouter

from app.api.v1.endpoints import history, indices, quotes

api_router = APIRouter()
api_router.include_router(indices.router, prefix="/indices", tags=["indices"])
api_router.include_router(quotes.router, prefix="/quotes", tags=["quotes"])
api_router.include_router(history.router, prefix="/history", tags=["history"])
