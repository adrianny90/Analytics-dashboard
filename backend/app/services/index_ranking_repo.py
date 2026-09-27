import math

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.database import async_session_maker
from app.models.index_ranking import IndexRanking


async def load_ranking(universe: str) -> IndexRanking | None:
    """The last-saved ranking for this universe, or None if there isn't one
    yet (fresh database, or no scan has completed) or no database is
    configured."""
    if async_session_maker is None:
        return None
    async with async_session_maker() as session:
        return await session.get(IndexRanking, universe)


def _finite(value):
    """Replaces NaN/Infinity (which Postgres JSONB rejects) with None."""
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, dict):
        return {k: _finite(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_finite(v) for v in value]
    return value


async def save_ranking(universe: str, entries: list[dict]) -> None:
    """Upserts the ranking row for this universe. No-op (never an error)
    when no database is configured."""
    if async_session_maker is None:
        return
    entries = _finite(entries)
    async with async_session_maker() as session:
        stmt = (
            pg_insert(IndexRanking)
            .values(id=universe, entries=entries)
            .on_conflict_do_update(
                index_elements=[IndexRanking.id],
                set_={"entries": entries, "updated_at": func.now()},
            )
        )
        await session.execute(stmt)
        await session.commit()
