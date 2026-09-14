from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.database import async_session_maker
from app.models.snapshot import MarketSnapshot

# Single-row table (see MarketSnapshot) - there's only ever one snapshot.
_SNAPSHOT_ID = 1


async def load_snapshot() -> MarketSnapshot | None:
    """The last-saved quote/trend snapshot, or None if there isn't one yet
    (fresh database) or no database is configured."""
    if async_session_maker is None:
        return None
    async with async_session_maker() as session:
        return await session.get(MarketSnapshot, _SNAPSHOT_ID)


async def save_snapshot(quotes: dict, trends: dict) -> None:
    """Upserts the single snapshot row. No-op (never an error) when no
    database is configured - this is a best-effort restart-recovery aid,
    not a hard dependency."""
    if async_session_maker is None:
        return
    async with async_session_maker() as session:
        stmt = (
            pg_insert(MarketSnapshot)
            .values(id=_SNAPSHOT_ID, quotes=quotes, trends=trends)
            .on_conflict_do_update(
                index_elements=[MarketSnapshot.id],
                set_={"quotes": quotes, "trends": trends, "updated_at": func.now()},
            )
        )
        await session.execute(stmt)
        await session.commit()
