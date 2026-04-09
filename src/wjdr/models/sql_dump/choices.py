"""Choice-system tables derived from the SQL dump."""

from __future__ import annotations

from typing import Any, Optional, cast

from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer
from sqlmodel import Field, Relationship, SQLModel

from wjdr.models.sql_dump.common import identity_primary_key


class SkillChoiceSkillLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "SkillChoiceSkillLinkTable")

    skill_id: int = Field(sa_column=Column(Integer, ForeignKey("SkillTable.id"), primary_key=True, nullable=False))
    choice_skill_id: int = Field(sa_column=Column(Integer, ForeignKey("ChoiceSkillTable.id"), primary_key=True, nullable=False))

    skill: "SkillTable" = Relationship(back_populates="choice_skill_links")
    choice_skill: "ChoiceSkillTable" = Relationship(back_populates="skill_links")


class TalentChoiceSkillLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "TalentChoiceSkillLinkTable")

    talent_id: int = Field(sa_column=Column(Integer, ForeignKey("TalentTable.id"), primary_key=True, nullable=False))
    choice_talent_id: int = Field(sa_column=Column(Integer, ForeignKey("ChoiceTalentTable.id"), primary_key=True, nullable=False))

    talent: "TalentTable" = Relationship(back_populates="choice_skill_links")
    choice_talent: "ChoiceTalentTable" = Relationship(back_populates="talent_choice_links")


class CareerSkillChoiceSkillFreeChoiceSkillLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CareerSkillChoiceSkillFreeChoiceSkillLinkTable")
    __table_args__ = (
        CheckConstraint(
            "(skill_id IS NOT NULL) OR (choice_skill_id IS NOT NULL) OR (free_choice_skill_id IS NOT NULL)",
            name="career_skill_not_all_null",
        ),
    )

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    skill_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("SkillTable.id"), nullable=True))
    choice_skill_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("ChoiceSkillTable.id"), nullable=True))
    free_choice_skill_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("FreeChoiceSkillTable.id"), nullable=True))

    skill: Optional["SkillTable"] = Relationship(back_populates="career_choice_rows")
    choice_skill: Optional["ChoiceSkillTable"] = Relationship(back_populates="career_choice_rows")
    free_choice_skill: Optional["FreeChoiceSkillTable"] = Relationship(back_populates="career_choice_rows")


class CareerTalentChoiceTalentFreeChoiceTalentLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CareerTalentChoiceTalentFreeChoiceTalentLinkTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    talent_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("TalentTable.id"), nullable=True))
    choice_talent_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("ChoiceTalentTable.id"), nullable=True))
    free_choice_talent_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("FreeChoiceTalentTable.id"), nullable=True))

    talent: Optional["TalentTable"] = Relationship(back_populates="career_choice_rows")
    choice_talent: Optional["ChoiceTalentTable"] = Relationship(back_populates="career_choice_rows")
    free_choice_talent: Optional["FreeChoiceTalentTable"] = Relationship(back_populates="career_choice_rows")


__all__ = [
    "CareerSkillChoiceSkillFreeChoiceSkillLinkTable",
    "CareerTalentChoiceTalentFreeChoiceTalentLinkTable",
    "SkillChoiceSkillLinkTable",
    "TalentChoiceSkillLinkTable",
]