from fastapi import APIRouter, HTTPException, Response

from app.services.favorites_repo import add_favorite, list_favorites, remove_favorite

router = APIRouter()

_MAX_SYMBOL_LENGTH = 20


def _normalize(symbol: str) -> str:
    normalized = symbol.strip().upper()
    if not normalized or len(normalized) > _MAX_SYMBOL_LENGTH:
        raise HTTPException(status_code=400, detail="invalid symbol")
    return normalized


@router.get("/", response_model=list[str])
async def get_favorites():
    """Every starred ("watched by me") symbol, oldest star first."""
    try:
        return await list_favorites()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.put("/{symbol}", status_code=204)
async def star_symbol(symbol: str):
    try:
        await add_favorite(_normalize(symbol))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return Response(status_code=204)


@router.delete("/{symbol}", status_code=204)
async def unstar_symbol(symbol: str):
    try:
        await remove_favorite(_normalize(symbol))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return Response(status_code=204)
