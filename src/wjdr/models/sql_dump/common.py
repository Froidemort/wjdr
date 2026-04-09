"""Shared SQL dump helpers and enums for normalized SQLModel mappings."""

from __future__ import annotations

from enum import Enum

from sqlalchemy import Column, Enum as SAEnum, Identity, Integer


def identity_primary_key() -> Column[int]:
    return Column(Integer, Identity(), primary_key=True, nullable=False)


def postgres_enum(enum_class: type[Enum], name: str) -> SAEnum:
    return SAEnum(
        enum_class,
        name=name,
        native_enum=True,
        values_callable=lambda members: [member.value for member in members],
    )


class GenderEnum(str, Enum):
    masculin = "masculin"
    feminin = "féminin"
    autre = "autre"


class PlayableRaceEnum(str, Enum):
    nain = "nain"
    humain = "humain"
    elfe = "elfe"
    halfling = "halfling"


class DynamicBonusEnum(str, Enum):
    BE = "BE"
    BF = "BF"


class SkillBonusEnum(str, Enum):
    zero = "0"
    ten = "10"
    twenty = "20"


class QualityEnum(str, Enum):
    exceptionelle = "exceptionelle"
    bonne = "bonne"
    normale = "normale"
    mediocre = "médiocre"


class LocationEnum(str, Enum):
    tete = "tete"
    bras_gauche = "bras gauche"
    bras_droit = "bras droit"
    corps = "corps"
    jambe_gauche = "jambe gauche"
    jambe_droite = "jambe droite"


gender_enum = GenderEnum
playable_race_enum = PlayableRaceEnum
dynamic_bonus = DynamicBonusEnum
skill_bonus = SkillBonusEnum
quality = QualityEnum
location = LocationEnum


__all__ = [
    "DynamicBonusEnum",
    "GenderEnum",
    "LocationEnum",
    "PlayableRaceEnum",
    "QualityEnum",
    "SkillBonusEnum",
    "dynamic_bonus",
    "gender_enum",
    "identity_primary_key",
    "location",
    "playable_race_enum",
    "postgres_enum",
    "quality",
    "skill_bonus",
]