"""Campaign and chapter tables derived from the SQL dump."""

from __future__ import annotations

import datetime
import uuid
from typing import Any, Optional, cast

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, Relationship, SQLModel

from wjdr.models.sql_dump.common import identity_primary_key


class CampaignTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CampaignTable")
    __table_args__ = (
        Index("CampaignTable_name_index", "name"),
        Index("CampaignTable_gm_name_index", "gm_name"),
    )

    id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False, unique=True))
    name: str = Field(sa_column=Column(String(127), nullable=False, unique=True))
    gm_name: Optional[str] = Field(default=None, sa_column=Column(String(127), nullable=True))
    start_date: datetime.datetime = Field(sa_column=Column(DateTime, nullable=False, server_default=text("CLOCK_TIMESTAMP()")))
    end_date: Optional[datetime.datetime] = Field(default=None, sa_column=Column(DateTime, nullable=True))

    scenarios: list["Scenario"] = Relationship(back_populates="campaign")


class Scenario(SQLModel, table=True):
    __tablename__ = cast(Any, "Scenario")
    __table_args__ = (Index("Scenario_name_index", "name"),)

    id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False, unique=True))
    campaign_uuid: Optional[uuid.UUID] = Field(default=None, sa_column=Column(UUID(as_uuid=True), ForeignKey("CampaignTable.id"), nullable=True))
    name: Optional[str] = Field(default=None, sa_column=Column(String(255), nullable=True))
    description: Optional[str] = Field(default=None, sa_column=Column(String(255), nullable=True))

    campaign: Optional[CampaignTable] = Relationship(back_populates="scenarios")
    chapters: list["ChapterTable"] = Relationship(back_populates="scenario")


class ChapterTable(SQLModel, table=True):
    __tablename__ = cast(Any, "ChapterTable")
    __table_args__ = (Index("ChapterTable_name_index", "name"),)

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    scenario_uuid: Optional[uuid.UUID] = Field(default=None, sa_column=Column(UUID(as_uuid=True), ForeignKey("Scenario.id"), nullable=True))
    name: str = Field(sa_column=Column(String(255), nullable=False))
    description: Optional[str] = Field(default=None, sa_column=Column(String(255), nullable=True))
    medias: Optional[int] = Field(default=None, sa_column=Column(Integer, nullable=True, unique=True))

    scenario: Optional[Scenario] = Relationship(back_populates="chapters")
    media_links: list["ChapterMediaLinkTable"] = Relationship(back_populates="chapter")
    inventory_slot_links: list["ChapterInventorySlotLinkTable"] = Relationship(back_populates="chapter")


class ChapterMediaLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "ChapterMediaLinkTable")

    chapter_id: int = Field(sa_column=Column(Integer, ForeignKey("ChapterTable.id"), primary_key=True, nullable=False))
    media_id: int = Field(sa_column=Column(Integer, ForeignKey("MediaTable.id"), primary_key=True, nullable=False))

    chapter: ChapterTable = Relationship(back_populates="media_links")
    media: "MediaTable" = Relationship()


class ChapterInventorySlotLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "ChapterInventorySlotLinkTable")

    chapter_reward_id: int = Field(sa_column=Column(Integer, ForeignKey("ChapterTable.id"), primary_key=True, nullable=False))
    inventory_slot_id: int = Field(sa_column=Column(Integer, ForeignKey("InventorySlotTable.id"), primary_key=True, nullable=False))

    chapter: ChapterTable = Relationship(back_populates="inventory_slot_links")


__all__ = [
    "CampaignTable",
    "ChapterInventorySlotLinkTable",
    "ChapterMediaLinkTable",
    "ChapterTable",
    "Scenario",
]