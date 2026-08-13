from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.database import async_session_maker
from app.models.ticker import WatchlistTicker


async def list_custom_tickers() -> list[WatchlistTicker]:
    """User-added tickers, persisted on top of the static curated
    watchlist. Empty (never an error) when no database is configured."""
    if async_session_maker is None:
        return []
    async with async_session_maker() as session:
        result = await session.execute(select(WatchlistTicker).order_by(WatchlistTicker.created_at))
        return list(result.scalars())


async def add_custom_ticker(symbol: str, sector: str = "Custom") -> WatchlistTicker:
    if async_session_maker is None:
        raise RuntimeError("DATABASE_NEON is not configured - set it in backend/.env")
    async with async_session_maker() as session:
        # Upsert: re-adding an already-tracked custom symbol just returns
        # the existing row instead of erroring.
        stmt = (
            pg_insert(WatchlistTicker)
            .values(symbol=symbol, sector=sector)
            .on_conflict_do_update(index_elements=[WatchlistTicker.symbol], set_={"symbol": symbol})
            .returning(WatchlistTicker)
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.scalar_one()
