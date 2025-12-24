from typing import Generator

import pytest

from wjdr.models.factory import primary_attribute_random_factory, secondary_attribute_random_factory, skill_factory, talent_factory
from wjdr.models.models import (
    Career,
    Character,
    CharacterSkill,
    Equipment,
    Experience,
    Inventory,
    Money,
    PrimaryAttribute,
    PrimaryAttributes,
    SecondaryAttribute,
    SecondaryAttributes,
    Skill,
    Talent,
)


@pytest.mark.unitary
@pytest.mark.parametrize(
    "input_gc, input_sp, input_cc, expected_gc, expected_sp, expected_cc, id",
    [
        (1, 19, 11, 1, 19, 11, "no_coercion_needed"),
        (1, 19, 20, 2, 0, 8, "copper_to_silver_and_gold"),
        (1, 40, 0, 3, 0, 0, "silver_to_gold"),
        (0, 0, 50, 0, 4, 2, "copper_to_silver"),
        (0, 0, 300, 1, 5, 0, "large_copper_to_gold_and_silver"),
    ],
)
def test_coerce_money(input_gc, input_sp, input_cc, expected_gc, expected_sp, expected_cc, id):
    m = Money(golden_crown=1, silver_pistol=19, copper_coins=11)
    gc, sp, cc = m.coerce_money(input_gc, input_sp, input_cc)
    assert (gc, sp, cc) == (expected_gc, expected_sp, expected_cc), f"Failed test: {id}"


@pytest.mark.unitary
def test_money_validation():
    m = Money(golden_crown=1, silver_pistol=19, copper_coins=11)
    assert m.golden_crown == 1
    assert m.silver_pistol == 19
    assert m.copper_coins == 11
    m.copper_coins += 20
    assert m.golden_crown == 2


@pytest.mark.integration
def test_money_validation_coercer():
    m = Money(golden_crown=0, silver_pistol=0, copper_coins=250)
    assert m.golden_crown == 1
    assert m.silver_pistol == 0
    assert m.copper_coins == 10


@pytest.mark.unitary
def test_money_operation():
    m1 = Money(golden_crown=1, silver_pistol=5, copper_coins=5)
    m2 = Money(golden_crown=0, silver_pistol=2, copper_coins=5)
    print(m1)
    print(m2)
    m3 = m1 + m2
    assert m3.golden_crown == 1
    assert m3.silver_pistol == 7
    assert m3.copper_coins == 10
    m4 = m1 - m2
    assert m4.golden_crown == 1
    assert m4.silver_pistol == 3
    assert m4.copper_coins == 0
    with pytest.raises(ValueError):
        _ = m2 - m1


@pytest.fixture
def equipment_data(mocker):
    equipment = mocker.MagicMock(spec=Equipment)
    equipment.clutter = 10
    equipment.quantity = 1
    yield equipment


@pytest.mark.unitary
def test_clutter_validation(equipment_data):
    inventory = Inventory(equipments=[equipment_data])
    assert inventory.total_clutter == 10


@pytest.mark.unitary
def test_experience_gain():
    experience = Experience(total=2000, spent=1800)
    assert experience.available == 200
    assert experience.spendable_ticks == 2


@pytest.mark.unitary
@pytest.mark.parametrize(
    ("base", "advanced", "permanent_bonus", "object_bonus", "expected_actual"),
    [
        (15, 5, 0, 0, 20),
        (10, 0, 5, 5, 20),
        (20, 10, 5, 5, 40),
    ],
)
def test_primary_attribute_actual(base, advanced, permanent_bonus, object_bonus, expected_actual):
    primary_attribute = PrimaryAttribute(base=base, advanced=advanced, permanent_bonus=permanent_bonus, object_bonus=object_bonus)
    assert primary_attribute.actual == expected_actual


@pytest.mark.unitary
@pytest.mark.parametrize(
    ("base", "advanced", "permanent_bonus", "object_bonus", "expected_actual"),
    [
        (12, 3, 0, 0, 15),
        (10, 2, 1, 1, 14),
        (8, 4, 2, 1, 15),
    ],
)
def test_secondary_attribute_actual(base, advanced, permanent_bonus, object_bonus, expected_actual):
    secondary_attribute = SecondaryAttribute(base=base, advanced=advanced, permanent_bonus=permanent_bonus, object_bonus=object_bonus)
    assert secondary_attribute.actual == expected_actual


@pytest.fixture
def career():
    yield Career(
        name="Warrior",
        primary_attributes={"fight_capacity": 0, "shooting_capacity": 0, "strength": 15, "toughness": 0, "agility": 10, "intelligence": 5, "mental_strength": 0, "sociability": 5},
        secondary_attributes={"attack": 0, "wounds": 2, "magic_point": 0, "movement": 0},
        skills=("dummy_skill",),
        talents=("dummy_talent",),
        basic=False,
    )


@pytest.mark.unitary
def test_career_experience_amount(career):
    assert career.career_experience_amount == 1100


@pytest.mark.unitary
def test_primary_attribute_random_factory(fixed_seed):
    with fixed_seed:
        primary_attributes = primary_attribute_random_factory(race="Humain")
        assert primary_attributes == {"fight_capacity": 23, "shooting_capacity": 29, "strength": 27, "toughness": 31, "agility": 29, "intelligence": 31, "mental_strength": 26, "sociability": 33}


@pytest.mark.unitary
def test_secondary_attribute_random_factory(fixed_seed):
    with fixed_seed:
        secondary_attributes = secondary_attribute_random_factory(race="Humain")
        assert secondary_attributes == {"attack": 1, "wounds": 10, "movement": 4, "magic_point": 0}


@pytest.mark.unitary
@pytest.mark.parametrize(
    ("race", "expected"),
    [
        ("Humain", ["Sang froid", "Calcul mental"]),
        (
            "Elfe",
            [
                "Acuité visuelle",
                ("Harmonie aethyrique", "Maitrise (arcs longs)"),
                ("Intelligent", "Sang froid"),
                "Vision nocturne",
            ],
        ),
        (
            "Nain",
            [
                "Fureur vengeresse",
                "Résistance à la magie",
                "Robuste",
                "Savoir faire nain",
                "Valeureux",
                "Vision nocturne",
            ],
        ),
        (
            "Halfling",
            [
                "Maitrise (lance-pierre)",
                "Résistance au chaos",
                "Vision nocturne",
                "Sain d'esprit",
            ],
        ),
    ],
)
def test_talent_factory(fixed_seed, race, expected):
    with fixed_seed:
        talents = talent_factory(race=race)
        assert set(talents) == set(expected)


@pytest.mark.unitary
@pytest.mark.parametrize(
    ("race", "expected"),
    [
        ("Humain", ["Connaissances générales (l'Empire)", "Langue (Reikspiel)"]),
        (
            "Elfe",
            [
                "Connaissances générales (Elfes)",
                "Langue (Eltharin)",
                "Langue (Reikspiel)",
            ],
        ),
        (
            "Nain",
            [
                "Connaissances générales (Nains)",
                "Langue (Khazalid)",
                "Langue (Reikspiel)",
            ],
        ),
        (
            "Halfling",
            [
                "Commérage",
                "Langue (Reikspiel)",
                "Langue (Halfling)",
                (
                    "Connaissances académiques (généalogie)",
                    "Connaissances académiques (héraldique)",
                ),
                ("Métier (cuisinier)", "Métier (fermier)"),
                "Connaissances générales (Halflings)",
            ],
        ),
    ],
)
def test_skill_factory(race, expected):
    skills = skill_factory(race=race)
    assert set(skills) == set(expected)


@pytest.mark.unitary
def test_skill():
    skill = Skill(name="Test Skill", description="A skill for testing", attribute="strength", basic=True)
    another_skill = Skill(name="Another Skill", description="Another skill", attribute="agility", basic=False)
    assert skill != another_skill


@pytest.mark.unitary
def test_character(career):
    character_with_no_career = Character(name="Test Character", gender="Masculin", race="Humain", careers=[])
    assert character_with_no_career.careers == []
    assert character_with_no_career.current_career is None
    careers = [career for _ in range(3)]
    character_with_several_careers = Character(name="Test Character", gender="Masculin", race="Humain", careers=careers)
    assert character_with_several_careers.careers == careers
    assert character_with_several_careers.current_career == career


@pytest.fixture()
def primary_attribute():
    yield PrimaryAttribute(base=27, advanced=0)


@pytest.fixture()
def primary_attributes(primary_attribute):
    yield {
        "fight_capacity": primary_attribute,
        "shooting_capacity": primary_attribute,
        "strength": primary_attribute,
        "toughness": primary_attribute,
        "agility": primary_attribute,
        "intelligence": primary_attribute,
        "mental_strength": primary_attribute,
        "sociability": primary_attribute,
    }


@pytest.fixture()
def character(career, primary_attributes) -> Generator[Character, None, None]:
    yield Character(name="Test Character", gender="Masculin", race="Humain", careers=[career], primary_attributes=primary_attributes)


@pytest.mark.unitary
def test_character_current_career(character, career):
    assert character.current_career == career


@pytest.mark.unitary
def test_character_add_delete_skill(character, mocker):
    character_skill = mocker.MagicMock(spec=CharacterSkill)
    character_skill.skill = mocker.MagicMock(spec=Skill)
    character_skill.bonus = 0
    character.add_skill(character_skill)
    assert character_skill in character.skills
    character.delete_skill(character_skill)
    assert character_skill not in character.skills
    # Now we want to add several times the same skill
    character.add_skill(character_skill)
    character.add_skill(character_skill)
    # Here we cheat to get the first and unique skill
    assert next(iter(character.skills)).bonus == 10
    character.delete_skill(character_skill)
    # The delete here only modify the bonus, not the skill
    assert next(iter(character.skills)).bonus == 0
    character.delete_skill(character_skill, all=True)
    # Now the skill is removed
    assert len(character.skills) == 0


@pytest.mark.unitary
def test_character_add_delete_talent(character, mocker):
    talent = mocker.MagicMock(spec=Talent)
    character.add_talent(talent)
    assert talent in character.talents
    character.delete_talent(talent)
    assert talent not in character.talents


@pytest.mark.unitary
def test_character_max_clutter(character):
    assert character.max_clutter == 27 * 10


@pytest.mark.unitary
def test_character_is_cluttered(character):
    assert not character.is_cluttered


@pytest.mark.integration
def test_character_creation_flow(fixed_seed):
    with fixed_seed:
        # Minimal character creation flow test
        character = Character(name="New Character", gender="Masculin", race="Humain", careers=[])
        character.primary_attributes = PrimaryAttributes(**{attribute: PrimaryAttribute(base=value, advanced=0) for attribute, value in primary_attribute_random_factory(race=character.race).items()})
        character.secondary_attributes = SecondaryAttributes(**{attribute: SecondaryAttribute(base=value, advanced=0) for attribute, value in secondary_attribute_random_factory(race=character.race).items()})
        assert character.primary_attributes.strength.base == 27
        assert character.secondary_attributes.wounds.base == 13
