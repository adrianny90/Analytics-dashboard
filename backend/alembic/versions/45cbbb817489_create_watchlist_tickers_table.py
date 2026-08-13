"""create watchlist_tickers table

Revision ID: 45cbbb817489
Revises:
Create Date: 2026-08-07 11:02:15.432603

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '45cbbb817489'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('watchlist_tickers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('symbol', sa.String(length=20), nullable=False),
    sa.Column('sector', sa.String(length=50), server_default='Custom', nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_watchlist_tickers_symbol'), 'watchlist_tickers', ['symbol'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_watchlist_tickers_symbol'), table_name='watchlist_tickers')
    op.drop_table('watchlist_tickers')
