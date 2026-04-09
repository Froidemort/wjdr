"""Character, career, and character link tables derived from the SQL dump."""

from __future__ import annotations

import uuid
from typing import Any, Optional, cast

from sqlalchemy import Boolean, Column, ForeignKey, Index, Integer, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, Relationship, SQLModel

from wjdr.models.sql_dump.common import GenderEnum, PlayableRaceEnum, SkillBonusEnum, identity_primary_key, postgres_enum


class PrimaryAttributesTable(SQLModel, table=True):
    __tablename__ = cast(Any, "PrimaryAttributesTable")
    __table_args__ = (
        Index(
            "PrimaryAttributesTable_attributes_index",
            "fight_capacity",
            "shooting_capacity",
            "strength",
            "thoughness",
            "agility",
            "intelligence",
            "mental_strength",
            "sociability",
        ),
    )

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    fight_capacity: int = Field(sa_column=Column(SmallInteger, nullable=False))
    shooting_capacity: int = Field(sa_column=Column(SmallInteger, nullable=False))
    strength: int = Field(sa_column=Column(SmallInteger, nullable=False))
    thoughness: int = Field(sa_column=Column(SmallInteger, nullable=False))
    agility: int = Field(sa_column=Column(SmallInteger, nullable=False))
    intelligence: int = Field(sa_column=Column(SmallInteger, nullable=False))
    mental_strength: int = Field(sa_column=Column(SmallInteger, nullable=False))
    sociability: int = Field(sa_column=Column(SmallInteger, nullable=False))

    characters: list["CharacterTable"] = Relationship(back_populates="primary_attributes")


class SecondaryAttributesTable(SQLModel, table=True):
    __tablename__ = cast(Any, "SecondaryAttributesTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    wounds: int = Field(sa_column=Column(SmallInteger, nullable=False))
    movement: int = Field(sa_column=Column(SmallInteger, nullable=False))
    magic_points: int = Field(default=0, sa_column=Column(SmallInteger, nullable=False, server_default=text("0")))
    madness_points: int = Field(default=0, sa_column=Column(SmallInteger, nullable=False, server_default=text("0")))
    destiny_points: int = Field(sa_column=Column(SmallInteger, nullable=False))

    characters: list["CharacterTable"] = Relationship(back_populates="secondary_attributes")


class ExperienceTable(SQLModel, table=True):
    __tablename__ = cast(Any, "ExperienceTable")
    __table_args__ = (Index("ExperienceTable_available_spent_index", "available", "spent"),)

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    available: int = Field(default=0, sa_column=Column(SmallInteger, nullable=False, server_default=text("0")))
    spent: int = Field(default=0, sa_column=Column(SmallInteger, nullable=False, server_default=text("0")))

    characters: list["CharacterTable"] = Relationship(back_populates="experience")


class CharacterTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CharacterTable")
    __table_args__ = (Index("CharacterTable_name_index", "name"),)

    id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False))
    name: str = Field(sa_column=Column(String(255), nullable=False))
    gender: GenderEnum = Field(sa_column=Column(postgres_enum(GenderEnum, "gender_enum"), nullable=False))
    race: PlayableRaceEnum = Field(sa_column=Column(postgres_enum(PlayableRaceEnum, "playable_race_enum"), nullable=False))
    primary_attributes_id: int = Field(sa_column=Column(Integer, ForeignKey("PrimaryAttributesTable.id"), nullable=False))
    secondary_attributes_id: int = Field(sa_column=Column(Integer, ForeignKey("SecondaryAttributesTable.id"), nullable=False))
    experience_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("ExperienceTable.id"), nullable=True))
    profile_picture_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("MediaTable.id"), nullable=True))

    primary_attributes: PrimaryAttributesTable = Relationship(back_populates="characters")
    secondary_attributes: SecondaryAttributesTable = Relationship(back_populates="characters")
    experience: Optional[ExperienceTable] = Relationship(back_populates="characters")
    profile_picture: Optional["MediaTable"] = Relationship(back_populates="profile_picture_characters")
    skill_links: list["CharacterSkillLinkTable"] = Relationship(back_populates="character")
    spell_links: list["CharacterSpellLinkTable"] = Relationship(back_populates="character")
    talent_links: list["CharacterTalentLinkTable"] = Relationship(back_populates="character")
    career_links: list["CharacterCareerLinkTable"] = Relationship(back_populates="character")


class CareerTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CareerTable")

    id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False))
    name: str = Field(sa_column=Column(String(255), nullable=False, unique=True))
    description: Optional[str] = Field(default=None, sa_column=Column(String(255), nullable=True))
    basic: bool = Field(sa_column=Column(Boolean, nullable=False))
    primary_attributes_bonus_id: int = Field(sa_column=Column(Integer, ForeignKey("PrimaryAttributesTable.id"), nullable=False))
    secondary_attributes_id: int = Field(sa_column=Column(Integer, ForeignKey("SecondaryAttributesTable.id"), nullable=False))

    primary_attributes_bonus: PrimaryAttributesTable = Relationship()
    secondary_attributes: SecondaryAttributesTable = Relationship()
    character_links: list["CharacterCareerLinkTable"] = Relationship(back_populates="career")
    skill_links: list["CareerSkillLinkTable"] = Relationship(back_populates="career")
    talent_links: list["CareerTalentLinkTable"] = Relationship(back_populates="career")
    downstream_career_links: list["CareerCareerLinkTable"] = Relationship(
        back_populates="upstream_career",
        sa_relationship_kwargs={"foreign_keys": "[CareerCareerLinkTable.upstream_career_id]"},
    )
    upstream_career_links: list["CareerCareerLinkTable"] = Relationship(
        back_populates="downstream_career",
        sa_relationship_kwargs={"foreign_keys": "[CareerCareerLinkTable.downstream_career_id]"},
    )
    object_links: list["CareerObjectLinkTable"] = Relationship(back_populates="career")


class CharacterSkillLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CharacterSkillLinkTable")

    character_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("CharacterTable.id"), primary_key=True, nullable=False))
    skill_id: int = Field(sa_column=Column(Integer, ForeignKey("SkillTable.id"), primary_key=True, nullable=False))
    bonus: SkillBonusEnum = Field(sa_column=Column(postgres_enum(SkillBonusEnum, "skill_bonus"), nullable=False))

    character: CharacterTable = Relationship(back_populates="skill_links")
    skill: "SkillTable" = Relationship(back_populates="character_links")


class CharacterTalentLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CharacterTalentLinkTable")

    character_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("CharacterTable.id"), primary_key=True, nullable=False))
    talent_id: int = Field(sa_column=Column(Integer, ForeignKey("TalentTable.id"), primary_key=True, nullable=False))

    character: CharacterTable = Relationship(back_populates="talent_links")
    talent: "TalentTable" = Relationship(back_populates="character_links")


class CharacterCareerLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CharacterCareerLinkTable")

    character_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("CharacterTable.id"), primary_key=True, nullable=False))
    career_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("CareerTable.id"), primary_key=True, nullable=False))
    order: int = Field(sa_column=Column(SmallInteger, nullable=False))

    character: CharacterTable = Relationship(back_populates="career_links")
    career: CareerTable = Relationship(back_populates="character_links")


class CareerSkillLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CareerSkillLinkTable")

    career_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("CareerTable.id"), primary_key=True, nullable=False))
    skill_id: int = Field(sa_column=Column(Integer, ForeignKey("SkillTable.id"), primary_key=True, nullable=False))

    career: CareerTable = Relationship(back_populates="skill_links")
    skill: "SkillTable" = Relationship(back_populates="career_links")


class CareerTalentLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CareerTalentLinkTable")

    career_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("CareerTable.id"), primary_key=True, nullable=False))
    talent_id: int = Field(sa_column=Column(Integer, ForeignKey("TalentTable.id"), primary_key=True, nullable=False))

    career: CareerTable = Relationship(back_populates="talent_links")
    talent: "TalentTable" = Relationship(back_populates="career_links")


class CareerCareerLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CareerCareerLinkTable")

    upstream_career_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("CareerTable.id"), primary_key=True, nullable=False))
    downstream_career_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("CareerTable.id"), primary_key=True, nullable=False))

    upstream_career: CareerTable = Relationship(
        back_populates="downstream_career_links",
        sa_relationship_kwargs={"foreign_keys": "[CareerCareerLinkTable.upstream_career_id]"},
    )
    downstream_career: CareerTable = Relationship(
        back_populates="upstream_career_links",
        sa_relationship_kwargs={"foreign_keys": "[CareerCareerLinkTable.downstream_career_id]"},
    )


class CharacterInventorySlotLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CharacterInventorySlotLinkTable")

    character_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("CharacterTable.id"), primary_key=True, nullable=False))
    inventory_slot_id: int = Field(sa_column=Column(Integer, ForeignKey("InventorySlotTable.id"), primary_key=True, nullable=False))


class CharacterSpellLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CharacterSpellLinkTable")

    character_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("CharacterTable.id"), primary_key=True, nullable=False))
    spell_id: int = Field(sa_column=Column(Integer, ForeignKey("SpellTable.id"), primary_key=True, nullable=False))

    character: CharacterTable = Relationship(back_populates="spell_links")
    spell: "SpellTable" = Relationship(back_populates="character_links")


__all__ = [
    "CareerCareerLinkTable",
    "CareerSkillLinkTable",
    "CareerTable",
    "CareerTalentLinkTable",
    "CharacterCareerLinkTable",
    "CharacterInventorySlotLinkTable",
    "CharacterSkillLinkTable",
    "CharacterSpellLinkTable",
    "CharacterTable",
    "CharacterTalentLinkTable",
    "ExperienceTable",
    "PrimaryAttributesTable",
    "SecondaryAttributesTable",
]