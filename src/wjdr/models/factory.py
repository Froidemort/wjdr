"""Factory functions to generate character data and race-based tables.

This module groups all helper functions whose names end with ``_factory``.
They are imported by application code and tests to build randomized
attributes and race-dependent skills/talents.
"""

from __future__ import annotations

import random
from typing import Literal, get_args

from .models import (
    PrimaryAttributeName,
    SecondaryAttributeName,
)
from .random import DicePool, dice_roll_map


def primary_attribute_random_factory(
    race: Literal["Elfe", "Nain", "Humain", "Halfling"],
    seed: int | None = None,
) -> dict[PrimaryAttributeName, int]:
    """Generate random primary attributes using 2d10 plus race modifier.

    Parameters
    ----------
    race : {"Elfe", "Nain", "Humain", "Halfling"}
        Character race.
    seed : int | None, optional
        Random seed for reproducibility.

    Returns
    -------
    dict[PrimaryAttributeName, int]
        Mapping of attribute name to base value.
    """
    primary_attribute_race_modifiers = {
        "fight_capacity": {"Humain": 20, "Nain": 30, "Elfe": 20, "Halfling": 10},
        "shooting_capacity": {"Humain": 20, "Nain": 20, "Elfe": 30, "Halfling": 30},
        "strength": {"Humain": 20, "Nain": 20, "Elfe": 20, "Halfling": 20},
        "toughness": {"Humain": 20, "Nain": 30, "Elfe": 20, "Halfling": 10},
        "agility": {"Humain": 20, "Nain": 10, "Elfe": 30, "Halfling": 30},
        "intelligence": {"Humain": 20, "Nain": 20, "Elfe": 20, "Halfling": 20},
        "mental_strength": {"Humain": 20, "Nain": 20, "Elfe": 20, "Halfling": 20},
        "sociability": {"Humain": 20, "Nain": 10, "Elfe": 20, "Halfling": 30},
    }
    if seed is not None:
        random.seed(seed)  # pragma: no cover
    attrs: dict[PrimaryAttributeName, int] = {}
    for attr in get_args(PrimaryAttributeName):
        base_value = DicePool({10: 2}, primary_attribute_race_modifiers[attr][race]).roll()
        attrs[attr] = base_value
    return attrs


def secondary_attribute_random_factory(
    race: Literal["Elfe", "Nain", "Humain", "Halfling"],
    seed: int | None = None,
) -> dict[SecondaryAttributeName, int]:
    """Generate default secondary attributes for a new character.

    Parameters
    ----------
    race : {"Elfe", "Nain", "Humain", "Halfling"}
        Character race.
    seed : int | None, optional
        Random seed for reproducibility.

    Returns
    -------
    dict[SecondaryAttributeName, int]
        Default values with race-based variations.
    """
    if seed is not None:
        random.seed(seed)  # pragma: no cover
    attr: dict[SecondaryAttributeName, int] = {}
    attr["attack"] = 1  # Always 1 attack at start
    wounds_race_pool_map = {
        "Humain": {(1, 3): 10, (4, 6): 11, (7, 9): 12, (10, 12): 13},
        "Nain": {(1, 3): 11, (4, 6): 12, (7, 9): 13, (10, 12): 14},
        "Elfe": {(1, 3): 9, (4, 6): 10, (7, 9): 11, (10, 12): 12},
        "Halfling": {(1, 3): 8, (4, 6): 9, (7, 9): 10, (10, 12): 11},
    }
    attr["wounds"] = dice_roll_map(10, wounds_race_pool_map[race])
    movement_race_modifier = {"Humain": 4, "Nain": 3, "Elfe": 5, "Halfling": 4}
    attr["movement"] = movement_race_modifier[race]
    attr["magic_point"] = 0  # Always 0 at start
    return attr


def skill_factory(race: Literal["Elfe", "Nain", "Humain", "Halfling"]) -> list[str | tuple[str, ...]]:
    """Return race-specific starting skills."""
    match race:
        case "Elfe":
            return [
                "Connaissances générales (Elfes)",
                "Langue (Eltharin)",
                "Langue (Reikspiel)",
            ]
        case "Nain":
            return [
                "Connaissances générales (Nains)",
                "Langue (Khazalid)",
                "Langue (Reikspiel)",
            ]
        case "Humain":
            return ["Connaissances générales (l'Empire)", "Langue (Reikspiel)"]
        case "Halfling":
            return [
                "Commérage",
                "Langue (Reikspiel)",
                "Langue (Halfling)",
                (
                    "Connaissances académiques (généalogie)",
                    "Connaissances académiques (héraldique)",
                ),
                ("Métier (cuisinier)", "Métier (fermier)"),
                "Connaissances générales (Halflings)",
            ]
    raise ValueError(f"Unknown race {race}")  # pragma: no cover


def talent_factory(
    race: Literal["Elfe", "Nain", "Humain", "Halfling"],
    seed: int | None = None,
) -> list[str | tuple[str, ...]]:
    """Return race-specific starting talents.

    For Humans: roll two random talents on d100. For Halflings: fixed talents
    plus one random on d100. Elves and Dwarfs have fixed lists here.
    """
    race_talent_map = {
        "Humain": {
            (1, 4): "Acuité auditive",
            (5, 9): "Acuité visuelle",
            (10, 14): "Ambidextre",
            (15, 18): "Calcul mental",
            (19, 22): "Chance",
            (23, 26): "Course à pied",
            (27, 30): "Sociable",
            (31, 35): "Dur à cuire",
            (36, 39): "Force accrue",
            (40, 44): "Guerrier né",
            (45, 48): "Imitation",
            (49, 53): "Intelligent",
            (54, 57): "Réflexes éclair",
            (58, 61): "Résistance à la magie",
            (62, 65): "Résistance accrue",
            (66, 69): "Résistance aux maladies",
            (70, 73): "Résistance aux poisons",
            (74, 77): "Robuste",
            (78, 81): "Sain d'esprit",
            (82, 85): "Sang froid",
            (86, 90): "Sixième sens",
            (91, 95): "Tireur d'élite",
            (96, 100): "Vision nocturne",
        },
        "Halfling": {
            (1, 5): "Acuité auditive",
            (6, 10): "Acuité visuelle",
            (11, 15): "Ambidextre",
            (16, 20): "Calcul mental",
            (21, 25): "Chance",
            (26, 30): "Course à pied",
            (31, 35): "Sociable",
            (36, 39): "Dur à cuire",
            (40, 43): "Force accrue",
            (44, 48): "Guerrier né",
            (49, 53): "Imitation",
            (54, 58): "Intelligent",
            (59, 62): "Réflexes éclair",
            (63, 64): "Résistance à la magie",
            (65, 68): "Résistance accrue",
            (69, 72): "Résistance aux maladies",
            (73, 76): "Résistance aux poisons",
            (77, 81): "Robuste",
            (82, 86): "Sain d'esprit",
            (87, 91): "Sang froid",
            (92, 96): "Sixième sens",
            (97, 100): "Tireur d'élite",
        },
    }
    if seed is not None:
        random.seed(seed)  # pragma: no cover
    match race:
        case "Elfe":
            return [
                "Acuité visuelle",
                ("Harmonie aethyrique", "Maitrise (arcs longs)"),
                ("Intelligent", "Sang froid"),
                "Vision nocturne",
            ]
        case "Nain":
            return [
                "Fureur vengeresse",
                "Résistance à la magie",
                "Robuste",
                "Savoir faire nain",
                "Valeureux",
                "Vision nocturne",
            ]
        case "Humain":
            return [
                dice_roll_map(100, race_talent_map[race]),
                dice_roll_map(100, race_talent_map[race]),
            ]
        case "Halfling":
            return [
                "Maitrise (lance-pierre)",
                "Résistance au chaos",
                "Vision nocturne",
                dice_roll_map(100, race_talent_map[race]),
            ]
