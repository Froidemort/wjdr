from __future__ import annotations

from random import randint

from wjdr.models import PlayableRaceEnum, PrimaryAttributeEnum, SecondaryAttributeEnum

BASE_ATTRIBUTE_PLAYABLERACE = {
    PlayableRaceEnum.HUMAN: {
        PrimaryAttributeEnum.WEAPON_SKILL: 20,
        PrimaryAttributeEnum.BALLISTIC_SKILL: 20,
        PrimaryAttributeEnum.STRENGTH: 20,
        PrimaryAttributeEnum.TOUGHNESS: 20,
        PrimaryAttributeEnum.AGILITY: 20,
        PrimaryAttributeEnum.INTELLIGENCE: 20,
        PrimaryAttributeEnum.WILLPOWER: 20,
        PrimaryAttributeEnum.FELLOWSHIP: 20,
        SecondaryAttributeEnum.ATTACKS: 1,
        SecondaryAttributeEnum.WOUNDS: 0,
        SecondaryAttributeEnum.MOVEMENT: 4,
        SecondaryAttributeEnum.FATE_POINTS: 0,
        SecondaryAttributeEnum.INSANITY_POINTS: 0,
    },
    PlayableRaceEnum.ELF: {
        PrimaryAttributeEnum.WEAPON_SKILL: 20,
        PrimaryAttributeEnum.BALLISTIC_SKILL: 30,
        PrimaryAttributeEnum.STRENGTH: 20,
        PrimaryAttributeEnum.TOUGHNESS: 20,
        PrimaryAttributeEnum.AGILITY: 30,
        PrimaryAttributeEnum.INTELLIGENCE: 20,
        PrimaryAttributeEnum.WILLPOWER: 20,
        PrimaryAttributeEnum.FELLOWSHIP: 20,
        SecondaryAttributeEnum.ATTACKS: 1,
        SecondaryAttributeEnum.WOUNDS: 0,
        SecondaryAttributeEnum.MOVEMENT: 5,
        SecondaryAttributeEnum.FATE_POINTS: 0,
        SecondaryAttributeEnum.INSANITY_POINTS: 0,
    },
    PlayableRaceEnum.DWARF: {
        PrimaryAttributeEnum.WEAPON_SKILL: 30,
        PrimaryAttributeEnum.BALLISTIC_SKILL: 10,
        PrimaryAttributeEnum.STRENGTH: 20,
        PrimaryAttributeEnum.TOUGHNESS: 30,
        PrimaryAttributeEnum.AGILITY: 10,
        PrimaryAttributeEnum.INTELLIGENCE: 20,
        PrimaryAttributeEnum.WILLPOWER: 20,
        PrimaryAttributeEnum.FELLOWSHIP: 10,
        SecondaryAttributeEnum.ATTACKS: 1,
        SecondaryAttributeEnum.WOUNDS: 0,
        SecondaryAttributeEnum.MOVEMENT: 3,
        SecondaryAttributeEnum.FATE_POINTS: 0,
        SecondaryAttributeEnum.INSANITY_POINTS: 0,
    },
    PlayableRaceEnum.HALFLING: {
        PrimaryAttributeEnum.WEAPON_SKILL: 10,
        PrimaryAttributeEnum.BALLISTIC_SKILL: 30,
        PrimaryAttributeEnum.STRENGTH: 10,
        PrimaryAttributeEnum.TOUGHNESS: 10,
        PrimaryAttributeEnum.AGILITY: 30,
        PrimaryAttributeEnum.INTELLIGENCE: 20,
        PrimaryAttributeEnum.WILLPOWER: 20,
        PrimaryAttributeEnum.FELLOWSHIP: 20,
        SecondaryAttributeEnum.ATTACKS: 1,
        SecondaryAttributeEnum.WOUNDS: 0,
        SecondaryAttributeEnum.MOVEMENT: 4,
        SecondaryAttributeEnum.FATE_POINTS: 0,
        SecondaryAttributeEnum.INSANITY_POINTS: 0,
    },
}

# Here are the intervals to roll 1d10 dice to determine the wounds of a character based on his race.
RACE_WOUNDS_RULES: dict[PlayableRaceEnum, dict[tuple[int, int], int]] = {
    PlayableRaceEnum.HUMAN: {(1, 3): 10, (4, 6): 11, (7, 9): 12, (10, 12): 13},
    PlayableRaceEnum.DWARF: {(1, 3): 11, (4, 6): 12, (7, 9): 13, (10, 12): 14},
    PlayableRaceEnum.ELF: {(1, 3): 9, (4, 6): 10, (7, 9): 11, (10, 12): 12},
    PlayableRaceEnum.HALFLING: {(1, 3): 8, (4, 6): 9, (7, 9): 10, (10, 12): 11},
}

# Here are the intervals to roll 1d10 dice to determine the fate points of a character based on his race
RACE_FATE_POINTS_RULES: dict[PlayableRaceEnum, dict[tuple[int, int], int]] = {
    PlayableRaceEnum.HUMAN: {(1, 4): 2, (5, 7): 3, (8, 10): 3},
    PlayableRaceEnum.DWARF: {(1, 4): 2, (5, 7): 3, (8, 10): 3},
    PlayableRaceEnum.ELF: {(1, 4): 1, (5, 7): 2, (8, 10): 2},
    PlayableRaceEnum.HALFLING: {(1, 4): 2, (5, 7): 2, (8, 10): 3},
}

RACE_CAPACITIES: dict[PlayableRaceEnum, dict[str, dict[str, str | None]]] = {
    PlayableRaceEnum.HUMAN: {"skill": {}, "talent": {}},
    PlayableRaceEnum.ELF: {"skill": {}, "talent": {}},
    PlayableRaceEnum.DWARF: {
        "skill": {},
        "talent": {},
    },
    PlayableRaceEnum.HALFLING: {
        "skill": {},
        "talent": {},
    },
}


def roll_interval(faces: int, intervals: dict[tuple[int, int], int]) -> int:
    """Roll a dice with the given number of faces and return the value corresponding to the interval in which the roll falls.

    Args:
    faces (int): The number of faces of the dice to roll.
    intervals (dict[tuple[int, int], int]): A dictionary where the keys are tuples representing the intervals of the roll and the values are the corresponding values to return.

    Returns:
    int: The value corresponding to the interval in which the roll falls.
    """
    roll = randint(1, faces)
    for (min_roll, max_roll), value in intervals.items():
        if min_roll <= roll <= max_roll:
            return value
    raise ValueError(f"Invalid roll {roll} for intervals {intervals}")


def generate_attributes(playable_race: PlayableRaceEnum) -> dict[PrimaryAttributeEnum | SecondaryAttributeEnum, int]:
    """Generate the base attributes of a character based on his race.
    It uses the BASE_ATTRIBUTE_PLAYABLERACE constant to generate the attributes of the character.
    Then, it rolls 1d10 to determine the wounds and fate points of the character based on his race."""
    attributes = BASE_ATTRIBUTE_PLAYABLERACE[playable_race].copy()
    # Roll 1d10 to determine the wounds and fate points of the character based on his race.
    wounds_roll = randint(1, 10)
    fate_points_roll = randint(1, 10)
    attributes[SecondaryAttributeEnum.WOUNDS] = roll_interval(wounds_roll, RACE_WOUNDS_RULES[playable_race])
    attributes[SecondaryAttributeEnum.FATE_POINTS] = roll_interval(fate_points_roll, RACE_FATE_POINTS_RULES[playable_race])
    return attributes


def generate_capacities(playable_race: PlayableRaceEnum) -> dict[str, list[tuple[str, str | None]]]:
    """Generate the capacities of a character based on his race.
    The capacities are determined by the race, and some of them are randomly chosen, others can be chosen between a list of possible capacities.
    """
    capacities = {"skill": [], "talent": []}
    # TODO: implement the skill and talents for races.
    return capacities
