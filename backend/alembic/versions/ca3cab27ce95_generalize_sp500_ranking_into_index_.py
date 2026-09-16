"""generalize sp500_ranking into index_ranking

Revision ID: ca3cab27ce95
Revises: 05a323625f8d
Create Date: 2026-09-16 20:01:25.834301

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ca3cab27ce95'
down_revision: Union[str, Sequence[str], None] = '05a323625f8d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Autogenerate also proposed dropping several tables belonging to other
    # unrelated projects on this shared Neon database - stripped out, since
    # this migration must only manage this app's own schema.
    op.create_table('index_ranking',
    sa.Column('id', sa.String(length=20), nullable=False),
    sa.Column('entries', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.drop_table('sp500_ranking')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table('sp500_ranking',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('entries', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=False),
    sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('sp500_ranking_pkey'))
    )
    op.drop_table('index_ranking')
