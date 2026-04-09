"""Equipment, object, and inventory tables derived from the SQL dump."""

from __future__ import annotations

import uuid
from typing import Any, Optional, cast

from sqlalchemy import Column, ForeignKey, Index, Integer, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, Relationship, SQLModel

from wjdr.models.sql_dump.common import LocationEnum, QualityEnum, identity_primary_key, postgres_enum


class ObjectTable(SQLModel, table=True):
    __tablename__ = cast(Any, "ObjectTable")
    __table_args__ = (
        Index("ObjectTable_name_index", "name"),
        Index("ObjectTable_quality_index", "quality"),
    )

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    name: str = Field(sa_column=Column(String(255), nullable=False))
    quality: QualityEnum = Field(sa_column=Column(postgres_enum(QualityEnum, "quality"), nullable=False))
    clutter: Optional[int] = Field(default=0, sa_column=Column(SmallInteger, nullable=True, server_default=text("0")))
    value_money_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("MoneyTable.id"), nullable=True))
    equipment_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("EquipmentLink.id"), nullable=True))

    value_money: Optional["MoneyTable"] = Relationship(back_populates="valued_objects")
    equipment: Optional["EquipmentLink"] = Relationship(back_populates="objects")
    inventory_slots: list["InventorySlotTable"] = Relationship(back_populates="object")
    object_choice_links: list["ObjectObjectChoiceLinkTable"] = Relationship(back_populates="object")
    career_object_choice_rows: list["CareerObjectObjectChoiceLinkTable"] = Relationship(back_populates="object")


class WeaponTable(SQLModel, table=True):
    __tablename__ = cast(Any, "WeaponTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    damage: int = Field(sa_column=Column(Integer, ForeignKey("DiceTable.id"), nullable=False))
    attribute_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("WeaponAttributesTable.id"), nullable=True))

    damage_dice: "DiceTable" = Relationship(back_populates="damage_weapons")
    attribute: Optional["WeaponAttributesTable"] = Relationship(back_populates="attributed_weapons")
    equipment_links: list["EquipmentLink"] = Relationship(back_populates="weapon")
    weapon_attribute_links: list["WeaponWeaponAttributesTable"] = Relationship(back_populates="weapon")


class ArmourTable(SQLModel, table=True):
    __tablename__ = cast(Any, "ArmourTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    points: int = Field(sa_column=Column(SmallInteger, nullable=False))
    location: Optional[LocationEnum] = Field(default=None, sa_column=Column(postgres_enum(LocationEnum, "location"), nullable=True))

    equipment_links: list["EquipmentLink"] = Relationship(back_populates="armour")


class WeaponWeaponAttributesTable(SQLModel, table=True):
    __tablename__ = cast(Any, "WeaponWeaponAttributesTable")

    weapon_id: int = Field(sa_column=Column(Integer, ForeignKey("WeaponTable.id"), primary_key=True, nullable=False))
    weapon_attributes_id: int = Field(sa_column=Column(Integer, ForeignKey("WeaponAttributesTable.id"), primary_key=True, nullable=False))

    weapon: WeaponTable = Relationship(back_populates="weapon_attribute_links")
    weapon_attribute: "WeaponAttributesTable" = Relationship()


class EquipmentLink(SQLModel, table=True):
    __tablename__ = cast(Any, "EquipmentLink")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    weapon_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("WeaponTable.id"), nullable=True))
    armour_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("ArmourTable.id"), nullable=True))

    weapon: Optional[WeaponTable] = Relationship(back_populates="equipment_links")
    armour: Optional[ArmourTable] = Relationship(back_populates="equipment_links")
    objects: list[ObjectTable] = Relationship(back_populates="equipment")


class InventorySlotTable(SQLModel, table=True):
    __tablename__ = cast(Any, "InventorySlotTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    object_id: int = Field(sa_column=Column(Integer, ForeignKey("ObjectTable.id"), nullable=False))
    quantity: int = Field(default=1, sa_column=Column(Integer, nullable=False, server_default=text("1")))

    object: ObjectTable = Relationship(back_populates="inventory_slots")


class ObjectObjectChoiceLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "ObjectObjectChoiceLinkTable")

    object_id: int = Field(sa_column=Column(Integer, ForeignKey("ObjectTable.id"), primary_key=True, nullable=False))
    object_choice_id: int = Field(sa_column=Column(Integer, ForeignKey("ObjectChoiceTable.id"), primary_key=True, nullable=False))

    object: ObjectTable = Relationship(back_populates="object_choice_links")
    object_choice: "ObjectChoiceTable" = Relationship()


class CareerObjectObjectChoiceLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CareerObjectObjectChoiceLinkTable")

    id: Optional[int] = Field(default=None, sa_column=identity_primary_key())
    object_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("ObjectTable.id"), nullable=True))
    object_choice_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("ObjectChoiceTable.id"), nullable=True))

    object: Optional[ObjectTable] = Relationship(back_populates="career_object_choice_rows")
    object_choice: Optional["ObjectChoiceTable"] = Relationship()
    career_links: list["CareerObjectLinkTable"] = Relationship(back_populates="object_row")


class CareerObjectLinkTable(SQLModel, table=True):
    __tablename__ = cast(Any, "CareerObjectLinkTable")

    career_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("CareerTable.id"), primary_key=True, nullable=False))
    object_id: int = Field(sa_column=Column(Integer, ForeignKey("CareerObjectObjectChoiceLinkTable.id"), primary_key=True, nullable=False))
    quantity: int = Field(default=1, sa_column=Column(Integer, ForeignKey("DiceTable.id"), nullable=False, server_default=text("1")))

    career: "CareerTable" = Relationship(back_populates="object_links")
    object_row: CareerObjectObjectChoiceLinkTable = Relationship(back_populates="career_links")
    quantity_dice: "DiceTable" = Relationship(back_populates="quantity_career_objects")


__all__ = [
    "ArmourTable",
    "CareerObjectLinkTable",
    "CareerObjectObjectChoiceLinkTable",
    "EquipmentLink",
    "InventorySlotTable",
    "ObjectObjectChoiceLinkTable",
    "ObjectTable",
    "WeaponTable",
    "WeaponWeaponAttributesTable",
]