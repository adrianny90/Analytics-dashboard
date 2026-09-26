from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.database import async_session_maker
from app.models.favorite import FavoriteSymbol


def _require_db() -> None:
    if async_session_maker is None:
        raise RuntimeError("DATABASE_NEON is not configured - set it in backend/.env")


async def list_favorites() -> list[str]:
    """Starred symbols, oldest star first."""
    _require_db()
    async with async_session_maker() as session:
        result = await session.execute(select(FavoriteSymbol.symbol).order_by(FavoriteSymbol.created_at))
        return list(result.scalars())


async def add_favorite(symbol: str) -> None:
    """Idempotent - starring an already-starred symbol is a no-op."""
    _require_db()
    async with async_session_maker() as session:
        await session.execute(
            pg_insert(FavoriteSymbol).values(symbol=symbol).on_conflict_do_nothing(index_elements=[FavoriteSymbol.symbol])
        )
        await session.commit()


async def remove_favorite(symbol: str) -> None:
    """Idempotent - un-starring a symbol that isn't starred is a no-op."""
    _require_db()
    async with async_session_maker() as session:
        await session.execute(delete(FavoriteSymbol).where(FavoriteSymbol.symbol == symbol))
        await session.commit()
