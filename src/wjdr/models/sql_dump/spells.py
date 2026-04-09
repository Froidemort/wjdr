"""Spell tables derived from the SQL dump."""

from __future__ import annotations

from typing import Any, Optional, cast

from sqlalchemy import Column, ForeignKey, Integer, SmallInteger, String, Text
from sqlmodel import Field, Relationship, SQLModel

from wjdr.models.sql_dump.common import identity_primary_key


class SpellTable(SQLModel, table=True):
    __tablename__ = cast(Any, "SpellTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    name: str = Field(sa_column=Column(String(255), nullable=False))
    description: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    difficulty: int = Field(sa_column=Column(SmallInteger, nullable=False))
    damage_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("DiceTable.id"), nullable=True))
    category_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("SpellCategoryTable.id"), nullable=True))

    damage_dice: Optional["DiceTable"] = Relationship(back_populates="damage_spells")
    category: Optional["SpellCategoryTable"] = Relationship(back_populates="spells")
    character_links: list["CharacterSpellLinkTable"] = Relationship(back_populates="spell")


__all__ = ["SpellTable"]