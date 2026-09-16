"""create sp500 ranking table

Revision ID: 05a323625f8d
Revises: d997601a28f6
Create Date: 2026-09-16 19:36:00.097888

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '05a323625f8d'
down_revision: Union[str, Sequence[str], None] = 'd997601a28f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Autogenerate also proposed dropping several tables ('line_chart',
    # 'users', 'employees', 'bar_chart', 'usersFastApi', 'posts', 'hero',
    # 'Players') belonging to other unrelated projects on this shared Neon
    # database - stripped out, since this migration must only manage this
    # app's own schema.
    op.create_table('sp500_ranking',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('entries', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('sp500_ranking')
