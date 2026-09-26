"""create favorite_symbols table

Revision ID: 7b2e4f1c9a30
Revises: ca3cab27ce95
Create Date: 2026-09-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7b2e4f1c9a30'
down_revision: Union[str, Sequence[str], None] = 'ca3cab27ce95'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('favorite_symbols',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('symbol', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_favorite_symbols_symbol'), 'favorite_symbols', ['symbol'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_favorite_symbols_symbol'), table_name='favorite_symbols')
    op.drop_table('favorite_symbols')
