"""Unified Model tables and enums for the application domain."""

import datetime
import uuid
from enum import Enum, StrEnum
from typing import Optional, cast

from pydantic import computed_field
from reflex import Model
from sqlalchemy import Index
from sqlalchemy.ext.declarative import declared_attr
from sqlmodel import Field, Relationship

# Enums definitions


class GenderEnum(StrEnum):
    """Gender enum for playable characters.

    We use a string enum to be able to easily display the gender in the frontend.
    """

    MASCULIN = "masculin"
    FEMININ = "feminin"
    OTHER = "autre"


class PlayableRaceEnum(StrEnum):
    """Playable races enum for playable characters.

    In Warhammer RPG, there are only 4 playable races."""

    DWARF = "nain"
    HUMAN = "humain"
    ELF = "elfe"
    HALFLING = "halfling"


class DynamicBonusEnum(str, Enum):
    """Dynamic bonus enum for dice pools.

    BE : Toughness Bonus, used for example to mitigate the damage of a weapon with the "Toughness Bonus" attribute.
    BF : Strength Bonus, used for example to increase the damage of a weapon with the "Strength Bonus" attribute.

    NOTE: this enum might be useless if we consider DicePoolTable useless.
    """

    BE = "BE"
    BF = "BF"


class SkillLevelEnum(Enum):
    """Skill level enum for the skill level of a capacity for a playable character.

    The level are a bonus in percent linked to the skill primary attribute.
    """

    BASE = 0
    LVL1 = 10
    LVL2 = 20


class QualityEnum(str, Enum):
    """Quality enum for objects."""

    EXCEPTIONAL = "exceptionelle"
    GOOD = "bonne"
    NORMAL = "normale"
    MEDIOCRE = "mediocre"


class LocationEnum(str, Enum):
    """Location enum for objects, used for armor pieces.

    This enum is useful when we play the advanced armour rules, where the location of the armor piece is important to know how it works.
    """

    HEAD = "tete"
    LEFT_ARM = "bras gauche"
    RIGHT_ARM = "bras droit"
    BODY = "corps"
    LEFT_LEG = "jambe gauche"
    RIGHT_LEG = "jambe droite"


class CategoryEnum(str, Enum):
    """Category enum. It disciminate between talent and skill.

    This is a modelisation choice, because skills and talents are very "similar" in term of data, but not in term of game mechanics.
    """

    TALENT = "talent"
    SKILL = "skill"


class PrimaryAttributeEnum(str, Enum):
    """Primary attribute enum for playable characters.

    This enum will not be updated.
    """

    WEAPON_SKILL = "weapon_skill"
    BALLISTIC_SKILL = "ballistic_skill"
    STRENGTH = "strength"
    TOUGHNESS = "toughness"
    AGILITY = "agility"
    INTELLIGENCE = "intelligence"
    WILLPOWER = "willpower"
    FELLOWSHIP = "fellowship"


class SecondaryAttributeEnum(str, Enum):
    """Secondary attribute enum for playable characters.

    This enum will not be updated.
    """

    ATTACKS = "attacks"
    WOUNDS = "wounds"
    MOVEMENT = "movement"
    INSANITY_POINTS = "insanity_points"
    FATE_POINTS = "fate_points"


class DifficultyEnum(str, Enum):
    """Difficulty enum for NPCs"""

    VERY_EASY = "très facile"
    MEDIUM_EASY = "assez facile"
    EASY = "facile"
    AVERAGE = "moyen"
    HARD = "difficile"
    MEDIUM_HARD = "assez difficile"
    VERY_HARD = "très difficile"
    IMPOSSIBLE = "impossible"


# ==================
# Link Tables
# ==================


class DicePoolDiceLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "DicePoolDiceLinkTable")

    dice_pool_id: int = Field(foreign_key="DicePoolTable.id", primary_key=True)
    dices_id: int = Field(foreign_key="DiceTable.id", primary_key=True)


class ChapterMediaLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "ChapterMediaLinkTable")

    chapter_id: int = Field(foreign_key="ChapterTable.id", primary_key=True)
    media_id: uuid.UUID = Field(foreign_key="MediaTable.id", primary_key=True)


class CareerCapacityLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "CareerCapacityLinkTable")

    career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)
    capacity_id: int = Field(foreign_key="CapacityTable.id", primary_key=True)


class CareerEquipmentLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "CareerEquipmentLinkTable")

    career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)
    equipment_id: int = Field(foreign_key="EquipmentTable.id", primary_key=True)


class CareerCareerLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "CareerCareerLinkTable")

    upstream_career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)
    downstream_career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)


class PlayableCharacterEquipmentLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "PlayableCharacterEquipmentLinkTable")

    playable_character_id: int = Field(foreign_key="PlayableCharacterTable.id", primary_key=True)
    equipment_id: int = Field(foreign_key="EquipmentTable.id", primary_key=True)


class PlayableCharacterCareerLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "PlayableCharacterCareerLinkTable")

    playable_character_id: int = Field(foreign_key="PlayableCharacterTable.id", primary_key=True)
    career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)
    order: int = Field(default=0, ge=0, nullable=False)


class PlayableCharacterSpellLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "PlayableCharacterSpellLinkTable")

    playable_character_id: int = Field(foreign_key="PlayableCharacterTable.id", primary_key=True)
    spell_id: int = Field(foreign_key="SpellTable.id", primary_key=True)


class PlayableCharacterCapacityLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "PlayableCharacterCapacityLinkTable")

    playable_character_id: int = Field(foreign_key="PlayableCharacterTable.id", primary_key=True)
    capacity_id: int = Field(foreign_key="CapacityTable.id", primary_key=True)
    skill_level: Optional[SkillLevelEnum] = Field(default=None, nullable=True)


class WeaponWeaponAttributesLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "WeaponWeaponAttributesLinkTable")

    weapon_id: int = Field(foreign_key="ObjectTable.id", primary_key=True)
    weapon_attributes_id: int = Field(foreign_key="WeaponAttributeTable.id", primary_key=True)


class NonPlayableCharacterSpoilLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "NonPlayableCharacterSpoilLinkTable")

    non_playable_character_id: uuid.UUID = Field(foreign_key="NonPlayableCharacterTable.id", primary_key=True)
    equipment_id: int = Field(foreign_key="EquipmentTable.id", primary_key=True)


class NonPlayableCharacterCapacityLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "NonPlayableCharacterCapacityLinkTable")

    non_playable_character_id: uuid.UUID = Field(foreign_key="NonPlayableCharacterTable.id", primary_key=True)
    capacity_id: int = Field(foreign_key="CapacityTable.id", primary_key=True)
    skill_level: Optional[SkillLevelEnum] = Field(default=None, nullable=True)


class NonPlayableCharacterSpellLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "NonPlayableCharacterSpellLinkTable")

    non_playable_character_id: uuid.UUID = Field(foreign_key="NonPlayableCharacterTable.id", primary_key=True)
    spell_id: int = Field(foreign_key="SpellTable.id", primary_key=True)


# ==================
# Dice Tables
# ==================
# NOTE: These tables may be useless because in Warhammer RPG, we only use d10.
# But they can be useful for the future, if we want to add support for other RPG systems,
# or if we want to add support for custom dice (for example, a d12 with custom faces),
#  or invent weapons that use other types of dice (for example, a weapon that use d6 for damage instead of d10).
# So we keep them for now, but they will be removed if it is too complex to maintain them.


class DiceTable(Model, table=True):
    __tablename__ = cast(declared_attr, "DiceTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    faces: int = Field(ge=1, nullable=False, description="Number of faces of the dice, for example 6 for a d6, 10 for a d10, etc.")
    quantity: int = Field(ge=1, nullable=False, description="Number of dice of this type.")

    dice_pools: list["DicePoolTable"] = Relationship(back_populates="dices", link_model=DicePoolDiceLinkTable)
    damage_objects: list["ObjectTable"] = Relationship(back_populates="damages")


class DicePoolTable(Model, table=True):
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


# ==================
# Spell Tables
# ==================


class SpellCategoryTable(Model, table=True):
    __tablename__ = cast(declared_attr, "SpellCategoryTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Name of the spell category")
    description: Optional[str] = Field(default=None, max_length=1023, description="Description of the spell category")

    spells: list["SpellTable"] = Relationship(back_populates="category")


class SpellTable(Model, table=True):
    __tablename__ = cast(declared_attr, "SpellTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Name of the spell")
    description: Optional[str] = Field(default=None, max_length=1023, description="Description of the spell")
    is_ritual: bool = Field(default=False, nullable=False, description="Whether the spell is a ritual or not")

    category_id: int = Field(foreign_key="SpellCategoryTable.id", nullable=False)
    difficulty: int = Field(ge=0, nullable=False, description="Difficulty level of the spell")
    damage_id: Optional[int] = Field(default=None, foreign_key="DicePoolTable.id", nullable=True)

    category: SpellCategoryTable = Relationship(back_populates="spells")
    damage: Optional[DicePoolTable] = Relationship(back_populates="spells")

    playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="spells", link_model=PlayableCharacterSpellLinkTable)
    non_playable_characters: list["NonPlayableCharacterTable"] = Relationship(back_populates="spells", link_model=NonPlayableCharacterSpellLinkTable)


# ==================
# Media Tables
# ==================
# NOTE: this table is used to store the media files (images, videos, etc.) that can be linked to campaigns, scenarios and chapters, or to other tables later.


class MediaTable(Model, table=True):
    __tablename__ = cast(declared_attr, "MediaTable")
    __table_args__ = (Index("MediaTable_name_index", "name"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Name of the media file")
    url: str = Field(max_length=255, nullable=False, description="URL of the media file, can be a local path or a remote URL")

    campaigns: list["CampaignTable"] = Relationship(back_populates="illustration_image")
    scenarios: list["ScenarioTable"] = Relationship(back_populates="illustration_image")
    chapters: list["ChapterTable"] = Relationship(back_populates="illustration_image")
    chapter_medias: list["ChapterTable"] = Relationship(back_populates="medias", link_model=ChapterMediaLinkTable)


class ChapterMarkdownTable(Model, table=True):
    __tablename__ = cast(declared_attr, "ChapterMarkdownTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    url: str = Field(nullable=False, description="URL of the markdown file, can be a local path or a remote URL")

    chapter: Optional["ChapterTable"] = Relationship(back_populates="markdown")


# ==================
# Campaign Tables
# ==================


class CampaignTable(Model, table=True):
    __tablename__ = cast(declared_attr, "CampaignTable")
    __table_args__ = (
        Index("campaignTable_name_index", "name"),
        Index("campaignTable_gm_name_index", "gm_name"),
        Index("campaignTable_start_date_index", "start_date"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Name of the campaign")
    description: Optional[str] = Field(default=None, max_length=1023, description="Description of the campaign")

    gm_name: Optional[str] = Field(default=None, max_length=127, description="Name of the game master")
    start_date: datetime.datetime = Field(default_factory=datetime.datetime.now, nullable=False, description="Start date of the campaign")
    end_date: Optional[datetime.datetime] = Field(default=None, description="End date of the campaign")
    illustration_image_id: Optional[uuid.UUID] = Field(default=None, foreign_key="MediaTable.id", nullable=True)

    illustration_image: Optional[MediaTable] = Relationship(back_populates="campaigns")
    scenarios: list["ScenarioTable"] = Relationship(back_populates="campaign")


class ScenarioTable(Model, table=True):
    __tablename__ = cast(declared_attr, "ScenarioTable")
    __table_args__ = (Index("scenarioTable_name_index", "name"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Title of the scenario")
    description: Optional[str] = Field(default=None, max_length=1023, description="Description of the scenario")

    campaign_id: Optional[uuid.UUID] = Field(default=None, foreign_key="CampaignTable.id", nullable=True)
    illustration_image_id: Optional[uuid.UUID] = Field(default=None, foreign_key="MediaTable.id", nullable=True)

    illustration_image: Optional[MediaTable] = Relationship(back_populates="scenarios")
    campaign: Optional[CampaignTable] = Relationship(back_populates="scenarios")
    chapters: list["ChapterTable"] = Relationship(back_populates="scenario")


class ChapterTable(Model, table=True):
    __tablename__ = cast(declared_attr, "ChapterTable")
    __table_args__ = (Index("chapterTable_name_index", "name"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Title of the chapter")
    description: Optional[str] = Field(default=None, max_length=255, description="Description of the chapter")

    scenario_id: Optional[uuid.UUID] = Field(default=None, foreign_key="ScenarioTable.id", nullable=True)
    illustration_image_id: Optional[uuid.UUID] = Field(default=None, foreign_key="MediaTable.id", nullable=True)
    markdown_content_id: Optional[int] = Field(default=None, foreign_key="ChapterMarkdownTable.id", nullable=True)

    medias: list[MediaTable] = Relationship(back_populates="chapter_medias", link_model=ChapterMediaLinkTable)
    illustration_image: Optional[MediaTable] = Relationship(back_populates="chapters")
    scenario: Optional[ScenarioTable] = Relationship(back_populates="chapters")
    markdown_content: Optional["ChapterMarkdownTable"] = Relationship(back_populates="chapter", sa_relationship_kwargs={"uselist": False})
    non_playable_characters: list["NonPlayableCharacterTable"] = Relationship(back_populates="chapter")


# ==================
# Equipment Tables
# ==================


class CurrencyTable(Model, table=True):
    __tablename__ = cast(declared_attr, "CurrencyTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    brass_pennies: int = Field(default=0, ge=0, nullable=False, description="Amount of brass pennies")
    silver_shillings: int = Field(default=0, ge=0, nullable=False, description="Amount of silver shillings")
    gold_crowns: int = Field(default=0, ge=0, nullable=False, description="Amount of gold crowns")

    objects: list["ObjectTable"] = Relationship(back_populates="price")


# TODO: add an SQL event to automatically coerce the currency to a correct resprensentation (1 gold crown = 20 silver shillings = 240 brass pennies).


class ObjectTable(Model, table=True):
    __tablename__ = cast(declared_attr, "ObjectTable")

    # TODO: add constraints to ensure that either damage_id or armour_points and armour_location are set, but not both.

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Name of the object")
    description: Optional[str] = Field(default=None, max_length=1023, description="Description of the object")
    clutter: Optional[int] = Field(default=0, ge=0, nullable=True, description="Clutter value of the object")
    quality: QualityEnum = Field(default=QualityEnum.NORMAL, nullable=False, description="Quality of the object")
    price_id: Optional[int] = Field(default=None, foreign_key="CurrencyTable.id", nullable=True)

    damages_id: Optional[int] = Field(default=None, foreign_key="DiceTable.id", nullable=True)
    armour_points: Optional[int] = Field(default=None, ge=0, nullable=True, description="Armour points of the object, used for armor pieces")
    armour_location: Optional[LocationEnum] = Field(default=None, nullable=True, description="Location of the armour on the character")

    price: Optional[CurrencyTable] = Relationship(back_populates="objects")
    damages: Optional[DiceTable] = Relationship(back_populates="damage_objects")
    equipment: list["EquipmentTable"] = Relationship(back_populates="object")

    weapon_attributes: list["WeaponAttributeTable"] = Relationship(back_populates="objects", link_model=WeaponWeaponAttributesLinkTable)


class WeaponAttributeTable(Model, table=True):
    __tablename__ = cast(declared_attr, "WeaponAttributeTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Name of the weapon attribute")
    description: str = Field(max_length=255, nullable=False, description="Description of the weapon attribute, especially the potential effects.")

    objects: list[ObjectTable] = Relationship(back_populates="weapon_attributes", link_model=WeaponWeaponAttributesLinkTable)


class EquipmentTable(Model, table=True):
    __tablename__ = cast(declared_attr, "EquipmentTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    object_id: int = Field(foreign_key="ObjectTable.id", nullable=False)
    quantity: int = Field(default=1, ge=1, nullable=False, description="Quantity of the object, used for example for arrows, or potions, etc.")

    object: ObjectTable = Relationship(back_populates="equipment")

    playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="equipments", link_model=PlayableCharacterEquipmentLinkTable)
    careers: list["CareerTable"] = Relationship(back_populates="trappings", link_model=CareerEquipmentLinkTable)
    non_playable_characters: list["NonPlayableCharacterTable"] = Relationship(back_populates="spoils", link_model=NonPlayableCharacterSpoilLinkTable)


# ===========================
# Attributes And Capacities Tables
# ===========================


class AttributesTable(Model, table=True):
    __tablename__ = cast(declared_attr, "AttributesTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    # Primary attributes
    weapon_skill: int = Field(ge=0, le=100, nullable=False, description="Weapon skill of the character, used for melee attacks")
    ballistic_skill: int = Field(ge=0, le=100, nullable=False, description="Ballistic skill of the character, used for ranged attacks")
    strength: int = Field(ge=0, le=100, nullable=False, description="Strength of the character, used for physical power")
    toughness: int = Field(ge=0, le=100, nullable=False, description="Toughness of the character, used for resilience")
    agility: int = Field(ge=0, le=100, nullable=False, description="Agility of the character, used for dexterity and initiative in combat")
    intelligence: int = Field(ge=0, le=100, nullable=False, description="Intelligence of the character, used for mental acuity, knowledge, and focalisation for casting spells")
    willpower: int = Field(ge=0, le=100, nullable=False, description="Willpower of the character, used for resisting mental attacks and maintaining focus")
    fellowship: int = Field(ge=0, le=100, nullable=False, description="Fellowship of the character, used for social interactions and leadership")
    # Secondary attributes
    attacks: int = Field(ge=0, nullable=False, description="Number of actions (and attack) of the character, used for combat")
    wounds: int = Field(ge=0, nullable=False, description="Number of wounds the character can take before dying.")
    movement: int = Field(ge=0, nullable=False, description="Movement speed of the character, used for determining how far they can move in a turn.")
    insanity_points: int = Field(ge=0, nullable=False, description="Insanity points of the character, used for tracking mental stability.")
    fate_points: int = Field(ge=0, nullable=False, description="Fate points of the character, used for influencing outcomes in their favor.")

    # TODO: add mental illness many-to-many relationship to list potential mental illness of the character.

    careers: list["CareerTable"] = Relationship(back_populates="attributes")
    base_playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="base_attributes", sa_relationship_kwargs={"foreign_keys": "[PlayableCharacterTable.base_attributes_id]"})
    total_playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="total_attributes", sa_relationship_kwargs={"foreign_keys": "[PlayableCharacterTable.total_attributes_id]"})
    npc_characters: list["NonPlayableCharacterTable"] = Relationship(back_populates="attributes")

    @computed_field
    @property
    def strength_bonus(self) -> int:
        """Strength bonus of the character, used for example to increase the damage of a weapon with the "Strength Bonus" attribute."""
        return self.strength // 10

    @computed_field
    @property
    def toughness_bonus(self) -> int:
        """Toughness bonus of the character, used for example to mitigate the damage of a weapon with the "Toughness Bonus" attribute."""
        return self.toughness // 10


class CapacityTable(Model, table=True):
    __tablename__ = cast(declared_attr, "CapacityTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Name of the capacity")
    specialization: Optional[str] = Field(default=None, max_length=255, description="Specialization of the capacity")
    description: Optional[str] = Field(default=None, max_length=1023, description="Description of the capacity")
    category: CategoryEnum = Field(nullable=False, description="Category of the capacity (talent or skill)")
    skill_attribute: Optional[PrimaryAttributeEnum] = Field(default=None, nullable=True, description="Primary attribute associated with the capacity, for skill only")
    talent_bonus: Optional[int] = Field(default=None, nullable=True, description="Bonus provided, talent only")
    # NOTE: we could modelize the fact that a talent is possibly linked to a list of skills... But this is not very simple, and it is not very useful, because we can put it in the description of the talent.

    playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="capacities", link_model=PlayableCharacterCapacityLinkTable)
    careers: list["CareerTable"] = Relationship(back_populates="capacities", link_model=CareerCapacityLinkTable)
    non_playable_characters: list["NonPlayableCharacterTable"] = Relationship(back_populates="capacities", link_model=NonPlayableCharacterCapacityLinkTable)


# ==================
# Career Tables
# ==================
# NOTE: Complex table, with a lot of relationships


class CareerTable(Model, table=True):
    __tablename__ = cast(declared_attr, "CareerTable")

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Name of the career")
    description: Optional[str] = Field(default=None, max_length=1023, description="Description of the career")
    is_basic: bool = Field(
        nullable=False,
        description="Indicates if the career is a basic career (e.g. a career that can be taken at the beginning of the character creation) or not (for example, a career that can only be taken after reaching a certain level in another career).",
    )
    special_access_rule: Optional[str] = Field(default=None, max_length=128, description="Special access rule for the career, if any")

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
    non_playable_characters: list["NonPlayableCharacterTable"] = Relationship(back_populates="career")


# ==================
# Character Tables
# ==================
# NOTE: Complex table, with a lot of relationships


class PersonalDetailTable(Model, table=True):
    __tablename__ = cast(declared_attr, "PersonalDetailTable")

    id: Optional[int] = Field(default=None, primary_key=True)
    biography: Optional[str] = Field(default=None, max_length=1023, description="Biography of the character, used for roleplay purposes")
    age: Optional[int] = Field(default=None, ge=0, nullable=True, description="Age of the character, used for roleplay purposes")
    height: Optional[int] = Field(default=None, ge=0, nullable=True, description="Height of the character, used for roleplay purposes")
    weight: Optional[int] = Field(default=None, ge=0, nullable=True, description="Weight of the character, used for roleplay purposes")
    eye_color: Optional[str] = Field(default=None, max_length=255, description="Eye color of the character, used for roleplay purposes")
    hair_color: Optional[str] = Field(default=None, max_length=255, description="Hair color of the character, used for roleplay purposes")
    siblings_number: Optional[int] = Field(default=None, ge=0, nullable=True, description="Number of siblings of the character, used for roleplay purposes")
    # TODO: use enum for astral_sign, because the number of astral sign is limited.
    astral_sign: Optional[str] = Field(default=None, max_length=255, description="Astral sign of the character, used for roleplay purposes")
    birthplace: Optional[str] = Field(default=None, max_length=255, description="Birthplace of the character, used for roleplay purposes")

    playable_characters: list["PlayableCharacterTable"] = Relationship(back_populates="personal_details")


class PlayableCharacterTable(Model, table=True):
    __tablename__ = cast(declared_attr, "PlayableCharacterTable")

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Name of the playable character")
    surname: Optional[str] = Field(default=None, max_length=255, description="Surname of the playable character")
    gender: GenderEnum = Field(nullable=False, description="Gender of the playable character")
    race: PlayableRaceEnum = Field(nullable=False, description="Race of the playable character")
    current_experience: int = Field(default=0, ge=0, nullable=False, description="Current experience points of the playable character")
    total_experience: int = Field(default=0, ge=0, nullable=False, description="Total experience points of the playable character")
    personal_details_id: Optional[int] = Field(default=None, foreign_key="PersonalDetailTable.id", nullable=True)
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
        """Spent experience points of the playable character, used for tracking how many experience points the character has spent."""
        return self.total_experience - self.current_experience


class NonPlayableCharacterTable(Model, table=True):
    __tablename__ = cast(declared_attr, "NonPlayableCharacterTable")

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False, description="Name of the non playable character")
    gender: Optional[GenderEnum] = Field(default=None, nullable=True, description="Gender of the non playable character")
    race: Optional[str] = Field(default=None, max_length=255, nullable=True, description="Race of the non playable character, free text to allow any race beyond the 4 playable ones")
    description: Optional[str] = Field(default=None, max_length=1023, description="Description of the non playable character")
    special_rules: Optional[str] = Field(default=None, max_length=1023, description="Special rules applying to this non playable character during encounters")

    difficulty: Optional[DifficultyEnum] = Field(default=None, nullable=True, description="Difficulty level of the non playable character")

    attributes_id: int = Field(foreign_key="AttributesTable.id", nullable=False)
    career_id: Optional[uuid.UUID] = Field(default=None, foreign_key="CareerTable.id", nullable=True)

    chapter_id: Optional[int] = Field(default=None, foreign_key="ChapterTable.id", nullable=True)

    attributes: AttributesTable = Relationship(back_populates="npc_characters")
    career: Optional[CareerTable] = Relationship(back_populates="non_playable_characters")

    spoils: list[EquipmentTable] = Relationship(back_populates="non_playable_characters", link_model=NonPlayableCharacterSpoilLinkTable)
    capacities: list[CapacityTable] = Relationship(back_populates="non_playable_characters", link_model=NonPlayableCharacterCapacityLinkTable)
    spells: list[SpellTable] = Relationship(back_populates="non_playable_characters", link_model=NonPlayableCharacterSpellLinkTable)

    chapter: Optional[ChapterTable] = Relationship(back_populates="non_playable_characters")
