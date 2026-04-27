"""Use enum for astral sign

Revision ID: 87995291b33b
Revises: 781ee757ac82
Create Date: 2026-04-27 16:45:45.494893

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '87995291b33b'
down_revision: Union[str, Sequence[str], None] = '781ee757ac82'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    astral_sign_enum = postgresql.ENUM(
        'WYMUND_THE_ANCHORITE',
        'THE_GREAT_CROSS',
        'THE_PAINTER_STROKE',
        'GNUTHUX_THE_BUFFALO',
        'DRAGOMAS_THE_DRAGON',
        'TWILIGHT',
        'GRUNGNI_S_SCABBARD',
        'MAMMIT_THE_WISE',
        'MUMMIT_THE_FOOL',
        'THE_TWO_OXEN',
        'THE_DANCER',
        'THE_DRUM',
        'THE_PIPER',
        'VOBIST_THE_PALE',
        'THE_BROKEN_CART',
        'THE_WILD_GOAT',
        'RHYA_S_CAULDRON',
        'CACKELFAX_THE_COCK',
        'THE_GRIMOIRE_BONESAW',
        'THE_WIZARD_S_STAR',
        name='astralsignenum',
    )
    astral_sign_enum.create(op.get_bind(), checkfirst=True)
    op.alter_column(
        'PersonalDetailTable',
        'astral_sign',
        existing_type=sa.VARCHAR(length=255),
        type_=astral_sign_enum,
        existing_nullable=True,
        postgresql_using='"astral_sign"::astralsignenum',
    )


def downgrade() -> None:
    """Downgrade schema."""
    astral_sign_enum = postgresql.ENUM(
        'WYMUND_THE_ANCHORITE',
        'THE_GREAT_CROSS',
        'THE_PAINTER_STROKE',
        'GNUTHUX_THE_BUFFALO',
        'DRAGOMAS_THE_DRAGON',
        'TWILIGHT',
        'GRUNGNI_S_SCABBARD',
        'MAMMIT_THE_WISE',
        'MUMMIT_THE_FOOL',
        'THE_TWO_OXEN',
        'THE_DANCER',
        'THE_DRUM',
        'THE_PIPER',
        'VOBIST_THE_PALE',
        'THE_BROKEN_CART',
        'THE_WILD_GOAT',
        'RHYA_S_CAULDRON',
        'CACKELFAX_THE_COCK',
        'THE_GRIMOIRE_BONESAW',
        'THE_WIZARD_S_STAR',
        name='astralsignenum',
    )
    op.alter_column(
        'PersonalDetailTable',
        'astral_sign',
        existing_type=astral_sign_enum,
        type_=sa.VARCHAR(length=255),
        existing_nullable=True,
        postgresql_using='"astral_sign"::text',
    )
    astral_sign_enum.drop(op.get_bind(), checkfirst=True)
