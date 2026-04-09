"""Standalone SQL dump tables with no high-level dependencies."""

from __future__ import annotations

from typing import Any, Optional, cast

from sqlalchemy import CheckConstraint, Column, Index, Integer, SmallInteger, String, Text
from sqlmodel import Field, Relationship, SQLModel

from wjdr.models.sql_dump.common import DynamicBonusEnum, identity_primary_key, postgres_enum


class MoneyTable(SQLModel, table=True):
    __tablename__ = cast(Any, "MoneyTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    copper_coins: int = Field(sa_column=Column(SmallInteger, nullable=False))
    silver_pistol: int = Field(sa_column=Column(SmallInteger, nullable=False))
    golden_crown: int = Field(sa_column=Column(Integer, nullable=False))

    valued_objects: list["ObjectTable"] = Relationship(back_populates="value_money")


class SkillTable(SQLModel, table=True):
    __tablename__ = cast(Any, "SkillTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    name: str = Field(sa_column=Column(String(255), nullable=False))
    specialization: Optional[str] = Field(default=None, sa_column=Column(String(255), nullable=True))
    description: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))

    character_links: list["CharacterSkillLinkTable"] = Relationship(back_populates="skill")
    career_links: list["CareerSkillLinkTable"] = Relationship(back_populates="skill")
    choice_skill_links: list["SkillChoiceSkillLinkTable"] = Relationship(back_populates="skill")
    career_choice_rows: list["CareerSkillChoiceSkillFreeChoiceSkillLinkTable"] = Relationship(back_populates="skill")


class TalentTable(SQLModel, table=True):
    __tablename__ = cast(Any, "TalentTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    name: str = Field(sa_column=Column(String(255), nullable=False))
    specialization: Optional[str] = Field(default=None, sa_column=Column(String(255), nullable=True))
    description: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))

    character_links: list["CharacterTalentLinkTable"] = Relationship(back_populates="talent")
    career_links: list["CareerTalentLinkTable"] = Relationship(back_populates="talent")
    choice_skill_links: list["TalentChoiceSkillLinkTable"] = Relationship(back_populates="talent")
    career_choice_rows: list["CareerTalentChoiceTalentFreeChoiceTalentLinkTable"] = Relationship(back_populates="talent")


class ChoiceSkillTable(SQLModel, table=True):
    __tablename__ = cast(Any, "ChoiceSkillTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())

    skill_links: list["SkillChoiceSkillLinkTable"] = Relationship(back_populates="choice_skill")
    career_choice_rows: list["CareerSkillChoiceSkillFreeChoiceSkillLinkTable"] = Relationship(back_populates="choice_skill")


class FreeChoiceSkillTable(SQLModel, table=True):
    __tablename__ = cast(Any, "FreeChoiceSkillTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    choices_number: int = Field(sa_column=Column(SmallInteger, nullable=False))

    career_choice_rows: list["CareerSkillChoiceSkillFreeChoiceSkillLinkTable"] = Relationship(back_populates="free_choice_skill")


class ChoiceTalentTable(SQLModel, table=True):
    __tablename__ = cast(Any, "ChoiceTalentTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())

    talent_choice_links: list["TalentChoiceSkillLinkTable"] = Relationship(back_populates="choice_talent")
    career_choice_rows: list["CareerTalentChoiceTalentFreeChoiceTalentLinkTable"] = Relationship(back_populates="choice_talent")


class FreeChoiceTalentTable(SQLModel, table=True):
    __tablename__ = cast(Any, "FreeChoiceTalentTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    choices_number: int = Field(sa_column=Column(SmallInteger, nullable=False))

    career_choice_rows: list["CareerTalentChoiceTalentFreeChoiceTalentLinkTable"] = Relationship(back_populates="free_choice_talent")


class ObjectChoiceTable(SQLModel, table=True):
    __tablename__ = cast(Any, "ObjectChoiceTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())


class MediaTable(SQLModel, table=True):
    __tablename__ = cast(Any, "MediaTable")
    __table_args__ = (
        Index("MediaTable_short_name_index", "short_name"),
        Index("MediaTable_short_name_relative_path_index", "short_name", "relative_path"),
    )

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    short_name: str = Field(sa_column=Column(String(255), nullable=False))
    relative_path: str = Field(sa_column=Column(String(512), nullable=False, unique=True))

    profile_picture_characters: list["CharacterTable"] = Relationship(back_populates="profile_picture")


class WeaponAttributesTable(SQLModel, table=True):
    __tablename__ = cast(Any, "WeaponAttributesTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())

    attributed_weapons: list["WeaponTable"] = Relationship(back_populates="attribute")


class SpellCategoryTable(SQLModel, table=True):
    __tablename__ = cast(Any, "SpellCategoryTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    name: str = Field(sa_column=Column(String(255), nullable=False))

    spells: list["SpellTable"] = Relationship(back_populates="category")


class DiceTable(SQLModel, table=True):
    __tablename__ = cast(Any, "DiceTable")
    __table_args__ = (CheckConstraint("COALESCE(faces, bonus, dynamic_bonus) IS NOT NULL"),)

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    faces: Optional[int] = Field(default=None, sa_column=Column(SmallInteger, nullable=True))
    bonus: Optional[int] = Field(default=None, sa_column=Column(SmallInteger, nullable=True))
    dynamic_bonus: Optional[DynamicBonusEnum] = Field(
        default=None,
        sa_column=Column(postgres_enum(DynamicBonusEnum, "dynamic_bonus"), nullable=True),
    )

    damage_weapons: list["WeaponTable"] = Relationship(back_populates="damage_dice")
    damage_spells: list["SpellTable"] = Relationship(back_populates="damage_dice")
    quantity_career_objects: list["CareerObjectLinkTable"] = Relationship(back_populates="quantity_dice")


__all__ = [
    "ChoiceSkillTable",
    "ChoiceTalentTable",
    "DiceTable",
    "FreeChoiceSkillTable",
    "FreeChoiceTalentTable",
    "MediaTable",
    "MoneyTable",
    "ObjectChoiceTable",
    "SkillTable",
    "SpellCategoryTable",
    "TalentTable",
    "WeaponAttributesTable",
]