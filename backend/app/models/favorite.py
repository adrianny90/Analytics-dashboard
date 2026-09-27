from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FavoriteSymbol(Base):
    """A ticker starred as "watched by me" - from the dashboard or any
    ranking tab (S&P 500, Nasdaq, NYSE, ...). Kept in the database so the
    stars follow the user across browsers and devices."""

    __tablename__ = "favorite_symbols"

    id: Mapped[int] = mapped_column(primary_key=True)
    symbol: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # Free-text notes (e.g. strengths/weaknesses for the next months), edited in the "Watched" section.
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
