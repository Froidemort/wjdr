"""Add currency coercion + weapon/armour constraints

Revision ID: 97e3fce6c941
Revises: 0982b0daff1c
Create Date: 2026-04-27 15:24:33.342653

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '97e3fce6c941'
down_revision: Union[str, Sequence[str], None] = '0982b0daff1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_check_constraint(
        "object_weapon_armour_xor_check",
        "ObjectTable",
        "damages_id IS NULL OR (armour_points IS NULL AND armour_location IS NULL)",
    )
    op.create_check_constraint(
        "object_armour_fields_together_check",
        "ObjectTable",
        "(armour_points IS NULL AND armour_location IS NULL) OR (armour_points IS NOT NULL AND armour_location IS NOT NULL)",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("object_armour_fields_together_check", "ObjectTable", type_="check")
    op.drop_constraint("object_weapon_armour_xor_check", "ObjectTable", type_="check")
