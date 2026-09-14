"""create market_snapshot table

Revision ID: d997601a28f6
Revises: 45cbbb817489
Create Date: 2026-09-14 19:47:28.780553

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd997601a28f6'
down_revision: Union[str, Sequence[str], None] = '45cbbb817489'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('market_snapshot',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('quotes', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('trends', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('market_snapshot')
