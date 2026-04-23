"""Unified SQLModel tables and enums for the application domain."""

import datetime
import uuid
from enum import Enum, StrEnum
from typing import Literal, Optional, cast

from pydantic import computed_field
from sqlalchemy import Index
from sqlalchemy.ext.declarative import declared_attr
from sqlmodel import Field, Relationship, SQLModel

PrimaryAttribute = Literal["weapon_skill", "ballistic_skill", "strength", "toughness", "agility", "intelligence", "willpower", "fellowship"]


# Enums definitions


class GenderEnum(StrEnum):
    MASCULIN = "masculin"
    FEMININ = "feminin"
    OTHER = "autre"


class PlayableRaceEnum(StrEnum):
    DWARF = "nain"
    HUMAN = "humain"
    ELF = "elfe"
    HALFLING = "halfling"


class DynamicBonusEnum(str, Enum):
    BE = "BE"
    BF = "BF"


class SkillLevelEnum(Enum):
    BASE = 0
    LVL1 = 10
    LVL2 = 20


class QualityEnum(str, Enum):
    EXCEPTIONAL = "exceptionelle"
    GOOD = "bonne"
    NORMAL = "normale"
    MEDIOCRE = "mediocre"


class LocationEnum(str, Enum):
    HEAD = "tete"
    LEFT_ARM = "bras gauche"
    RIGHT_ARM = "bras droit"
    BODY = "corps"
    LEFT_LEG = "jambe gauche"
    RIGHT_LEG = "jambe droite"


class CategoryEnum(str, Enum):
    TALENT = "talent"
    SKILL = "skill"


class PrimaryAttributeEnum(str, Enum):
    WEAPON_SKILL = "weapon_skill"
    BALLISTIC_SKILL = "ballistic_skill"
    STRENGTH = "strength"
    TOUGHNESS = "toughness"
    AGILITY = "agility"
    INTELLIGENCE = "intelligence"
    WILLPOWER = "willpower"
    FELLOWSHIP = "fellowship"


# Link tables


class DicePoolDiceLinkTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "DicePoolDiceLinkTable")

    dice_pool_id: int = Field(foreign_key="DicePoolTable.id", primary_key=True)
    dices_id: int = Field(foreign_key="DiceTable.id", primary_key=True)


class ChapterMediaLinkTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "ChapterMediaLinkTable")

    chapter_id: int = Field(foreign_key="ChapterTable.id", primary_key=True)
    media_id: uuid.UUID = Field(foreign_key="MediaTable.id", primary_key=True)


class CareerCapacityLinkTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "CareerCapacityLinkTable")

    career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)
    capacity_id: int = Field(foreign_key="CapacityTable.id", primary_key=True)


class CareerEquipmentLinkTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "CareerEquipmentLinkTable")

    career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)
    equipment_id: int = Field(foreign_key="EquipmentTable.id", primary_key=True)


class CareerCareerLinkTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "CareerCareerLinkTable")

    upstream_career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)
    downstream_career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)


class PlayableCharacterEquipmentLinkTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "PlayableCharacterEquipmentLinkTable")

    playable_character_id: int = Field(foreign_key="PlayableCharacterTable.id", primary_key=True)
    equipment_id: int = Field(foreign_key="EquipmentTable.id", primary_key=True)


class PlayableCharacterCareerLinkTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "PlayableCharacterCareerLinkTable")

    playable_character_id: int = Field(foreign_key="PlayableCharacterTable.id", primary_key=True)
    career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)
    order: int = Field(default=0, ge=0, nullable=False)


class PlayableCharacterSpellLinkTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "PlayableCharacterSpellLinkTable")

    playable_character_id: int = Field(foreign_key="PlayableCharacterTable.id", primary_key=True)
    spell_id: int = Field(foreign_key="SpellTable.id", primary_key=True)


class PlayableCharacterCapacityLinkTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "PlayableCharacterCapacityLinkTable")

    playable_character_id: int = Field(foreign_key="PlayableCharacterTable.id", primary_key=True)
    capacity_id: int = Field(foreign_key="CapacityTable.id", primary_key=True)
    skill_level: Optional[SkillLevelEnum] = Field(default=None, nullable=True)


# Dice
# NOTE: These tables may be useless because in Warhammer RPG, we only use d10.
# But they can be useful for the future, if we want to add support for other RPG systems,
# or if we want to add support for custom dice (for example, a d12 with custom faces),
#  or invent weapons that use other types of dice (for example, a weapon that use d6 for damage instead of d10).
# So we keep them for now, but they will be removed if it is too complex to maintain them.


class DiceTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "DiceTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    faces: int = Field(ge=1, nullable=False)
    quantity: int = Field(ge=1, nullable=False)

    dice_pools: list["DicePoolTable"] = Relationship(back_populates="dices", link_model=DicePoolDiceLinkTable)
    damage_objects: list["ObjectTable"] = Relationship(back_populates="damages")


class DicePoolTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "DicePoolTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    modifier: int = Field(default=0, nullable=False)
    dynamic_modifier: Optional[DynamicBonusEnum] = Field(default=None, nullable=True)

    dices: list[DiceTable] = Relationship(back_populates="dice_pools", link_model=DicePoolDiceLinkTable)
    spells: list["SpellTable"] = Relationship(back_populates="damage")

    def __str__(self) -> str:
        buffer = "+".join(f"{dice.quantity}d{dice.faces}" for dice in self.dices)
        if self.dynamic_modifier is not None:
            buffer += f"+{self.dynamic_modifier}"
        if self.modifier != 0:
            buffer += f"{self.modifier:+}"
        return buffer


# Spell


class SpellCategoryTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "SpellCategoryTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1023)

    spells: list["SpellTable"] = Relationship(back_populates="category")


class SpellTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "SpellTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1023)

    category_id: int = Field(foreign_key="SpellCategoryTable.id", nullable=False)
    difficulty: int = Field(ge=0, nullable=False)
    damage_id: Optional[int] = Field(default=None, foreign_key="DicePoolTable.id", nullable=True)

    category: SpellCategoryTable = Relationship(back_populates="spells")
    damage: Optional[DicePoolTable] = Relationship(back_populates="spells")

    playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="spells", link_model=PlayableCharacterSpellLinkTable)


# Media table
# NOTE: this table is used to store the media files (images, videos, etc.) that can be linked to campaigns, scenarios and chapters, or to other tables later.


class MediaTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "MediaTable")
    __table_args__ = (Index("MediaTable_name_index", "name"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    url: str = Field(max_length=255, nullable=False)

    campaigns: list["CampaignTable"] = Relationship(back_populates="illustration_image")
    scenarios: list["ScenarioTable"] = Relationship(back_populates="illustration_image")
    chapters: list["ChapterTable"] = Relationship(back_populates="illustration_image")
    chapter_medias: list["ChapterTable"] = Relationship(back_populates="medias", link_model=ChapterMediaLinkTable)


# Campaign tables


class CampaignTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "CampaignTable")
    __table_args__ = (
        Index("campaignTable_name_index", "name"),
        Index("campaignTable_gm_name_index", "gm_name"),
        Index("campaignTable_start_date_index", "start_date"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1023)

    gm_name: Optional[str] = Field(default=None, max_length=127)
    start_date: datetime.datetime = Field(default_factory=datetime.datetime.now, nullable=False)
    end_date: Optional[datetime.datetime] = Field(default=None)
    illustration_image_id: Optional[uuid.UUID] = Field(default=None, foreign_key="MediaTable.id", nullable=True)

    illustration_image: Optional[MediaTable] = Relationship(back_populates="campaigns")
    scenarios: list["ScenarioTable"] = Relationship(back_populates="campaign")


class ScenarioTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "ScenarioTable")
    __table_args__ = (Index("scenarioTable_name_index", "name"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1023)

    campaign_id: Optional[uuid.UUID] = Field(default=None, foreign_key="CampaignTable.id", nullable=True)
    illustration_image_id: Optional[uuid.UUID] = Field(default=None, foreign_key="MediaTable.id", nullable=True)

    illustration_image: Optional[MediaTable] = Relationship(back_populates="scenarios")
    campaign: Optional[CampaignTable] = Relationship(back_populates="scenarios")
    chapters: list["ChapterTable"] = Relationship(back_populates="scenario")


class ChapterTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "ChapterTable")
    __table_args__ = (Index("chapterTable_name_index", "name"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    description: Optional[str] = Field(default=None, max_length=255)

    scenario_id: Optional[uuid.UUID] = Field(default=None, foreign_key="ScenarioTable.id", nullable=True)
    illustration_image_id: Optional[uuid.UUID] = Field(default=None, foreign_key="MediaTable.id", nullable=True)

    medias: list[MediaTable] = Relationship(back_populates="chapter_medias", link_model=ChapterMediaLinkTable)
    illustration_image: Optional[MediaTable] = Relationship(back_populates="chapters")
    scenario: Optional[ScenarioTable] = Relationship(back_populates="chapters")


# Equipment tables


class CurrencyTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "CurrencyTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    brass_pennies: int = Field(default=0, ge=0, nullable=False)
    silver_shillings: int = Field(default=0, ge=0, nullable=False)
    gold_crowns: int = Field(default=0, ge=0, nullable=False)

    objects: list["ObjectTable"] = Relationship(back_populates="price")


# TODO: add an SQL event to automatically coerce the currency to a correct resprensentation (1 gold crown = 20 silver shillings = 240 brass pennies).


class WeaponWeaponAttributesLinkTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "WeaponWeaponAttributesLinkTable")

    weapon_id: int = Field(foreign_key="ObjectTable.id", primary_key=True)
    weapon_attributes_id: int = Field(foreign_key="WeaponAttributeTable.id", primary_key=True)


class ObjectTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "ObjectTable")

    # TODO: add constraints to ensure that either damage_id or armour_points and armour_location are set, but not both.

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1023)
    clutter: Optional[int] = Field(default=0, ge=0, nullable=True)
    quality: QualityEnum = Field(default=QualityEnum.NORMAL, nullable=False)
    price_id: Optional[int] = Field(default=None, foreign_key="CurrencyTable.id", nullable=True)

    damages_id: Optional[int] = Field(default=None, foreign_key="DiceTable.id", nullable=True)
    armour_points: Optional[int] = Field(default=None, ge=0, nullable=True)
    armour_location: Optional[LocationEnum] = Field(default=None, nullable=True)

    price: Optional[CurrencyTable] = Relationship(back_populates="objects")
    damages: Optional[DiceTable] = Relationship(back_populates="damage_objects")
    equipment: list["EquipmentTable"] = Relationship(back_populates="object")

    weapon_attributes: list["WeaponAttributeTable"] = Relationship(back_populates="objects", link_model=WeaponWeaponAttributesLinkTable)


class WeaponAttributeTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "WeaponAttributeTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    description: str = Field(max_length=255, nullable=False)

    objects: list[ObjectTable] = Relationship(back_populates="weapon_attributes", link_model=WeaponWeaponAttributesLinkTable)


class EquipmentTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "EquipmentTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    object_id: int = Field(foreign_key="ObjectTable.id", nullable=False)
    quantity: int = Field(default=1, ge=1, nullable=False)

    object: ObjectTable = Relationship(back_populates="equipment")

    playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="equipments", link_model=PlayableCharacterEquipmentLinkTable)
    careers: list["CareerTable"] = Relationship(back_populates="trappings", link_model=CareerEquipmentLinkTable)


# Atributes, capacity = skill&talent, ...


class AttributesTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "AttributesTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    # Primary attributes
    weapon_skill: int = Field(ge=0, le=100, nullable=False)
    ballistic_skill: int = Field(ge=0, le=100, nullable=False)
    strength: int = Field(ge=0, le=100, nullable=False)
    toughness: int = Field(ge=0, le=100, nullable=False)
    agility: int = Field(ge=0, le=100, nullable=False)
    intelligence: int = Field(ge=0, le=100, nullable=False)
    willpower: int = Field(ge=0, le=100, nullable=False)
    fellowship: int = Field(ge=0, le=100, nullable=False)
    # Secondary attributes
    attacks: int = Field(ge=0, nullable=False)
    wounds: int = Field(ge=0, nullable=False)
    movement: int = Field(ge=0, nullable=False)
    insanity_points: int = Field(ge=0, nullable=False)
    fate_points: int = Field(ge=0, nullable=False)

    careers: list["CareerTable"] = Relationship(back_populates="attributes")
    base_playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="base_attributes", sa_relationship_kwargs={"foreign_keys": "[PlayableCharacterTable.base_attributes_id]"})
    total_playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="total_attributes", sa_relationship_kwargs={"foreign_keys": "[PlayableCharacterTable.total_attributes_id]"})

    @computed_field
    @property
    def strength_bonus(self) -> int:
        return self.strength // 10

    @computed_field
    @property
    def toughness_bonus(self) -> int:
        return self.toughness // 10


class CapacityTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "CapacityTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1023)
    category: CategoryEnum = Field(nullable=False)
    skill_attribute: Optional[PrimaryAttributeEnum] = Field(default=None, nullable=True)
    talent_bonus: Optional[int] = Field(default=None, nullable=True)
    # NOTE: we could modelize the fact that a talent is possibly linked to a list of skills... But this is not very simple, and it is not very useful, because we can put it in the description of the talent.

    playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="capacities", link_model=PlayableCharacterCapacityLinkTable)
    careers: list["CareerTable"] = Relationship(back_populates="capacities", link_model=CareerCapacityLinkTable)


# Career
# NOTE: Complex table, with a lot of relationships


class CareerTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "CareerTable")

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1023)
    is_basic: bool = Field(nullable=False)
    special_access_rule: Optional[str] = Field(default=None, max_length=128)

    attributes_id: Optional[int] = Field(default=None, foreign_key="AttributesTable.id", nullable=True)

    attributes: Optional[AttributesTable] = Relationship(back_populates="careers")
    capacities: list[CapacityTable] = Relationship(back_populates="careers", link_model=CareerCapacityLinkTable)
    trappings: list[EquipmentTable] = Relationship(back_populates="careers", link_model=CareerEquipmentLinkTable)
    # Here we need to manage a complex many-to-many relationship with the CareerCareerLinkTable as association table, and two relationships to the CareerTable itself, one for the upstream careers and one for the downstream careers, with custom primaryjoin and secondaryjoin to manage the fact that we have two foreign keys to the same table in the association table.
    # This is useful because we can create a career progression tree, with the possibility to have multiple progression paths (for example, a career A can lead to both career B and career C, and career B and C can both lead to career D), and we can easily query the upstream and downstream careers of a given career.
    upstream_careers: list["CareerTable"] = Relationship(
        back_populates="downstream_careers",
        link_model=CareerCareerLinkTable,
        sa_relationship_kwargs={
            "primaryjoin": "CareerTable.id==CareerCareerLinkTable.downstream_career_id",
            "secondaryjoin": "CareerTable.id==CareerCareerLinkTable.upstream_career_id",
            "foreign_keys": "[CareerCareerLinkTable.upstream_career_id, CareerCareerLinkTable.downstream_career_id]",
        },
    )
    downstream_careers: list["CareerTable"] = Relationship(
        back_populates="upstream_careers",
        link_model=CareerCareerLinkTable,
        sa_relationship_kwargs={
            "primaryjoin": "CareerTable.id==CareerCareerLinkTable.upstream_career_id",
            "secondaryjoin": "CareerTable.id==CareerCareerLinkTable.downstream_career_id",
            "foreign_keys": "[CareerCareerLinkTable.upstream_career_id, CareerCareerLinkTable.downstream_career_id]",
        },
    )
    playable_characters: list["PlayableCharacterTable"] = Relationship(
        back_populates="career",
        link_model=PlayableCharacterCareerLinkTable,
    )


# PlayableCharacter table
# NOTE: Complex table, with a lot of relationships


class PersonalDetailTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "PersonalDetailTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    age: Optional[int] = Field(default=None, ge=0, nullable=True)
    height: Optional[int] = Field(default=None, ge=0, nullable=True)
    weight: Optional[int] = Field(default=None, ge=0, nullable=True)
    eye_color: Optional[str] = Field(default=None, max_length=255)
    hair_color: Optional[str] = Field(default=None, max_length=255)
    siblings_number: Optional[int] = Field(default=None, ge=0, nullable=True)
    astral_sign: Optional[str] = Field(default=None, max_length=255)
    birthplace: Optional[str] = Field(default=None, max_length=255)

    playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="personal_details")


class PlayableCharacterTable(SQLModel, table=True):
    __tablename__ = cast(declared_attr, "PlayableCharacterTable")

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    description: Optional[str] = Field(default=None, max_length=1023)
    name: str = Field(max_length=255, nullable=False)
    surname: Optional[str] = Field(default=None, max_length=255)
    gender: GenderEnum = Field(nullable=False)
    race: PlayableRaceEnum = Field(nullable=False)
    personal_details_id: Optional[int] = Field(default=None, foreign_key="PersonalDetailTable.id", nullable=True)
    current_experience: int = Field(default=0, ge=0, nullable=False)
    total_experience: int = Field(default=0, ge=0, nullable=False)
    # Base attribute valuue, initialized when a character is created
    base_attributes_id: int = Field(foreign_key="AttributesTable.id", nullable=False)
    # Base + career attribute bonus that can evolve when the character progress in his career with experience points.
    # TODO: add constraints to ensure that total_attributes is always equal to base_attributes + the sum of the attributes of the current careers of the character.
    # this contraints is complex to modelize, because it involves a lot of tables (PlayableCharacterTable, AttributesTable, CareerTable) and a lot of relationships (PlayableCharacterTable -> CareerTable through PlayableCharacterCareerLinkTable, CareerTable -> AttributesTable, PlayableCharacterTable -> AttributesTable for both base_attributes and total_attributes), but it is important to ensure data consistency.
    total_attributes_id: int = Field(foreign_key="AttributesTable.id", nullable=False)

    # TODO: consider adding a many-to-many relationship between PlayableCharacterTable and CampaignTable.

    base_attributes: "AttributesTable" = Relationship(back_populates="base_playable_characters", sa_relationship_kwargs={"foreign_keys": "[PlayableCharacterTable.base_attributes_id]"})
    total_attributes: "AttributesTable" = Relationship(back_populates="total_playable_characters", sa_relationship_kwargs={"foreign_keys": "[PlayableCharacterTable.total_attributes_id]"})
    personal_details: Optional[PersonalDetailTable] = Relationship(back_populates="playable_characters")
    equipments: list[EquipmentTable] = Relationship(back_populates="playable_characters", link_model=PlayableCharacterEquipmentLinkTable)
    spells: list[SpellTable] = Relationship(back_populates="playable_characters", link_model=PlayableCharacterSpellLinkTable)
    capacities: list[CapacityTable] = Relationship(back_populates="playable_characters", link_model=PlayableCharacterCapacityLinkTable)
    career: list[CareerTable] = Relationship(back_populates="playable_characters", link_model=PlayableCharacterCareerLinkTable)

    @computed_field
    @property
    def spent_experience(self) -> int:
        return self.total_experience - self.current_experience


# TODO: add a NonPlayableCharacterTable with the same fields as PlayableCharacterTable.
# The differences are :
# * attributes of a non playable character are not split into base and total attributes, because they don't have careers and don't evolve with experience points.
# * a non playable character eventually have a career (optional), but not a list
# * a non playable character don't have "equipments", but "spoils".
# * race is not in an enum, but a free text field, or a link to a RaceTable, because there are a lot of non playable character races, and we should not limit them to the 4 playable.
# * a non playable character don't have personal details, description is enough to describe them. But, a "special rules" could be added.
# * a non playable character can be linked to a campaign, a scenario and a chapter, to know where they appear in the story.
