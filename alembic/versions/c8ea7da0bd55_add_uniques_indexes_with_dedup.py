"""add uniques indexes with dedup

Revision ID: c8ea7da0bd55
Revises: 2da184808cd9
Create Date: 2026-05-02 08:26:51.076455

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8ea7da0bd55'
down_revision: Union[str, Sequence[str], None] = '2da184808cd9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _deduplicate_by_min_id(table_name: str, group_by_columns: list[str], where_clause: str | None = None) -> None:
    group_by_sql = ", ".join(group_by_columns)
    where_sql = f"\n            WHERE {where_clause}" if where_clause else ""

    op.execute(
        sa.text(
            f"""
            DELETE FROM "{table_name}"
            WHERE id::text NOT IN (
                SELECT MIN(id::text)
                FROM "{table_name}"{where_sql}
                GROUP BY {group_by_sql}
            )
            """
        )
    )


def _create_unique_with_dedup(constraint_name: str, table_name: str, columns: list[str], where_clause: str | None = None) -> None:
    _deduplicate_by_min_id(table_name=table_name, group_by_columns=columns, where_clause=where_clause)
    op.create_unique_constraint(constraint_name, table_name, columns)


def upgrade() -> None:
    """Upgrade schema."""
    _create_unique_with_dedup("unique_faces_quantity", "DiceTable", ["faces", "quantity"])

    _create_unique_with_dedup(
        "unique_modifier_dynamic_modifier",
        "DicePoolTable",
        ["modifier", "dynamic_modifier"],
        where_clause="dynamic_modifier IS NOT NULL",
    )

    _create_unique_with_dedup("uq_SpellCategoryTable_name", "SpellCategoryTable", ["name"])
    op.create_index("ix_SpellCategoryTable_name", "SpellCategoryTable", ["name"], unique=False)

    _create_unique_with_dedup("uq_SpellTable_name", "SpellTable", ["name"])
    op.create_index("ix_SpellTable_name", "SpellTable", ["name"], unique=False)

    _create_unique_with_dedup("unique_media_name_url", "MediaTable", ["name", "url"])

    op.add_column("ChapterMarkdownTable", sa.Column("name", sa.String(length=255), nullable=True))
    op.execute(
        sa.text(
            """
            UPDATE "ChapterMarkdownTable"
            SET name = COALESCE(NULLIF(REGEXP_REPLACE(url, '^.*/', ''), ''), 'markdown-' || id::text)
            WHERE name IS NULL
            """
        )
    )
    op.alter_column("ChapterMarkdownTable", "name", existing_type=sa.String(length=255), nullable=False)
    op.create_index("ix_ChapterMarkdownTable_name", "ChapterMarkdownTable", ["name"], unique=False)
    _create_unique_with_dedup("uq_ChapterMarkdownTable_url", "ChapterMarkdownTable", ["url"])

    _create_unique_with_dedup("unique_campaign_name_start_date", "CampaignTable", ["name", "start_date"])
    op.drop_index("campaignTable_start_date_index", table_name="CampaignTable")
    op.drop_index("campaignTable_name_index", table_name="CampaignTable")
    op.drop_index("campaignTable_gm_name_index", table_name="CampaignTable")
    op.create_index("campaignTable_name_gm_name_index", "CampaignTable", ["name", "gm_name"], unique=False)

    _create_unique_with_dedup("unique_currency_combination", "CurrencyTable", ["brass_pennies", "silver_shillings", "gold_crowns"])

    op.create_index("ix_ObjectTable_name", "ObjectTable", ["name"], unique=False)

    _create_unique_with_dedup("uq_WeaponAttributeTable_name", "WeaponAttributeTable", ["name"])
    op.create_index("ix_WeaponAttributeTable_name", "WeaponAttributeTable", ["name"], unique=False)

    _create_unique_with_dedup("uq_MentalIllnessTable_name", "MentalIllnessTable", ["name"])
    op.create_index("ix_MentalIllnessTable_name", "MentalIllnessTable", ["name"], unique=False)

    _create_unique_with_dedup(
        "unique_capacity_name_specialization",
        "CapacityTable",
        ["name", "specialization"],
        where_clause="specialization IS NOT NULL",
    )
    op.create_index("ix_CapacityTable_name", "CapacityTable", ["name"], unique=False)

    _create_unique_with_dedup("uq_CareerTable_name", "CareerTable", ["name"])
    op.create_index("ix_CareerTable_name", "CareerTable", ["name"], unique=False)

    _create_unique_with_dedup(
        "unique_playable_character",
        "PlayableCharacterTable",
        ["name", "surname", "gender", "race", "personal_details_id"],
        where_clause="surname IS NOT NULL AND personal_details_id IS NOT NULL",
    )
    op.create_index("playableCharacterTable_name_surname_index", "PlayableCharacterTable", ["name", "surname"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("playableCharacterTable_name_surname_index", table_name="PlayableCharacterTable")
    op.drop_constraint("unique_playable_character", "PlayableCharacterTable", type_="unique")

    op.drop_index("ix_CareerTable_name", table_name="CareerTable")
    op.drop_constraint("uq_CareerTable_name", "CareerTable", type_="unique")

    op.drop_index("ix_CapacityTable_name", table_name="CapacityTable")
    op.drop_constraint("unique_capacity_name_specialization", "CapacityTable", type_="unique")

    op.drop_index("ix_MentalIllnessTable_name", table_name="MentalIllnessTable")
    op.drop_constraint("uq_MentalIllnessTable_name", "MentalIllnessTable", type_="unique")

    op.drop_index("ix_WeaponAttributeTable_name", table_name="WeaponAttributeTable")
    op.drop_constraint("uq_WeaponAttributeTable_name", "WeaponAttributeTable", type_="unique")

    op.drop_index("ix_ObjectTable_name", table_name="ObjectTable")

    op.drop_constraint("unique_currency_combination", "CurrencyTable", type_="unique")

    op.drop_index("campaignTable_name_gm_name_index", table_name="CampaignTable")
    op.create_index("campaignTable_gm_name_index", "CampaignTable", ["gm_name"], unique=False)
    op.create_index("campaignTable_name_index", "CampaignTable", ["name"], unique=False)
    op.create_index("campaignTable_start_date_index", "CampaignTable", ["start_date"], unique=False)
    op.drop_constraint("unique_campaign_name_start_date", "CampaignTable", type_="unique")

    op.drop_constraint("uq_ChapterMarkdownTable_url", "ChapterMarkdownTable", type_="unique")
    op.drop_index("ix_ChapterMarkdownTable_name", table_name="ChapterMarkdownTable")
    op.drop_column("ChapterMarkdownTable", "name")

    op.drop_constraint("unique_media_name_url", "MediaTable", type_="unique")

    op.drop_index("ix_SpellTable_name", table_name="SpellTable")
    op.drop_constraint("uq_SpellTable_name", "SpellTable", type_="unique")

    op.drop_index("ix_SpellCategoryTable_name", table_name="SpellCategoryTable")
    op.drop_constraint("uq_SpellCategoryTable_name", "SpellCategoryTable", type_="unique")

    op.drop_constraint("unique_modifier_dynamic_modifier", "DicePoolTable", type_="unique")
    op.drop_constraint("unique_faces_quantity", "DiceTable", type_="unique")
