from collections.abc import AsyncIterator
from urllib.parse import parse_qs, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


def build_async_engine(url: str, **engine_kwargs) -> AsyncEngine:
    """Neon hands out a plain libpq-style DSN (`postgresql://...?sslmode=
    require&channel_binding=require`). Use asyncpg - unlike psycopg's async
    mode, it isn't broken by Windows' default ProactorEventLoop under
    uvicorn, which forces Proactor regardless of asyncio's event loop
    policy. SQLAlchemy's asyncpg dialect forwards unknown query params
    straight to asyncpg.connect() as kwargs though, and asyncpg has no
    sslmode/channel_binding kwargs, so those get stripped and TLS is
    requested directly via connect_args instead.

    Exported (not just used for the module-level `engine` below) so
    alembic/env.py can build its own engine - with a NullPool, since a
    one-off migration run shouldn't keep a pool around - off the same URL.
    """
    parts = urlsplit(url)
    query = parse_qs(parts.query)
    query.pop("sslmode", None)
    query.pop("channel_binding", None)
    async_url = urlunsplit(("postgresql+asyncpg", parts.netloc, parts.path, urlencode(query, doseq=True), ""))
    return create_async_engine(async_url, connect_args={"ssl": "require"}, **engine_kwargs)


engine: AsyncEngine | None = build_async_engine(settings.database_url, pool_pre_ping=True) if settings.database_url else None
async_session_maker = async_sessionmaker(engine, expire_on_commit=False) if engine else None


async def get_db() -> AsyncIterator[AsyncSession]:
    if async_session_maker is None:
        raise RuntimeError("DATABASE_NEON is not configured - set it in backend/.env")
    async with async_session_maker() as session:
        yield session
