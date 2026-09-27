from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from app.services.favorites_repo import add_favorite, list_favorites, list_notes, remove_favorite, set_note

router = APIRouter()

_MAX_SYMBOL_LENGTH = 20


class NoteBody(BaseModel):
    notes: str = Field(default="", max_length=10_000)


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


# Declared before "/{symbol}" routes, so "notes" isn't taken for a symbol.
@router.get("/notes", response_model=dict[str, str])
async def get_notes():
    """Notes per starred symbol (only symbols that have notes)."""
    try:
        return await list_notes()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.put("/{symbol}/notes", status_code=204)
async def put_notes(symbol: str, body: NoteBody):
    """Replaces the notes of a starred symbol (empty text clears them)."""
    try:
        found = await set_note(_normalize(symbol), body.notes.strip())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not found:
        raise HTTPException(status_code=404, detail="symbol is not starred")
    return Response(status_code=204)


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
