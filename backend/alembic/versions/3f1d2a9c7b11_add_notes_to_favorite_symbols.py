"""add notes to favorite_symbols

Revision ID: 3f1d2a9c7b11
Revises: 7b2e4f1c9a30
Create Date: 2026-09-27 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '3f1d2a9c7b11'
down_revision: Union[str, Sequence[str], None] = '7b2e4f1c9a30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('favorite_symbols', sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('favorite_symbols', 'notes')
