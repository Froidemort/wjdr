import uuid

import pytest
from sqlalchemy.exc import IntegrityError

from wjdr.models import (
    AttributesTable,
    CareerTable,
    GenderEnum,
    PlayableCharacterCareerLinkTable,
    PlayableCharacterTable,
    PlayableRaceEnum,
)
from wjdr.rules.playable_character_progression import (
    build_playable_character_career_link_with_next_order,
    get_current_career_for_character,
    get_next_playable_character_career_order,
    validate_playable_character_total_attributes,
)

pytestmark = pytest.mark.unitary


def _create_attributes(
    weapon_skill: int = 30,
    ballistic_skill: int = 25,
    strength: int = 35,
    toughness: int = 31,
    agility: int = 28,
    intelligence: int = 27,
    willpower: int = 32,
    fellowship: int = 23,
    attacks: int = 1,
    wounds: int = 12,
    movement: int = 4,
    insanity_points: int = 0,
    fate_points: int = 0,
) -> AttributesTable:
    return AttributesTable(
        weapon_skill=weapon_skill,
        ballistic_skill=ballistic_skill,
        strength=strength,
        toughness=toughness,
        agility=agility,
        intelligence=intelligence,
        willpower=willpower,
        fellowship=fellowship,
        attacks=attacks,
        wounds=wounds,
        movement=movement,
        insanity_points=insanity_points,
        fate_points=fate_points,
    )


def _create_playable_character(base_attributes: AttributesTable, total_attributes: AttributesTable) -> PlayableCharacterTable:
    return PlayableCharacterTable(
        name=f"pc-{uuid.uuid4()}",
        gender=GenderEnum.MASCULIN,
        race=PlayableRaceEnum.HUMAN,
        base_attributes=base_attributes,
        total_attributes=total_attributes,
    )


def _create_career_with_attributes(name: str, attributes: AttributesTable) -> CareerTable:
    return CareerTable(name=name, description="career for test", is_basic=True, attributes=attributes)


def test_total_attributes_can_match_base_plus_career_cap(session_fixture):
    base_attributes = _create_attributes()
    career_attributes = _create_attributes(
        weapon_skill=10,
        ballistic_skill=0,
        strength=0,
        toughness=10,
        agility=5,
        intelligence=0,
        willpower=0,
        fellowship=5,
        attacks=0,
        wounds=0,
        movement=0,
        insanity_points=0,
        fate_points=0,
    )
    total_attributes = _create_attributes(
        weapon_skill=40,
        ballistic_skill=25,
        strength=35,
        toughness=41,
        agility=33,
        intelligence=27,
        willpower=32,
        fellowship=28,
        attacks=1,
        wounds=12,
        movement=4,
        insanity_points=0,
        fate_points=0,
    )

    career = _create_career_with_attributes("Soldat", career_attributes)
    playable_character = _create_playable_character(base_attributes, total_attributes)
    validate_playable_character_total_attributes(playable_character, current_career=career)

    session_fixture.add(playable_character)
    session_fixture.commit()

    assert playable_character.id is not None


def test_total_attributes_above_career_cap_raise_error(session_fixture):
    base_attributes = _create_attributes()
    career_attributes = _create_attributes(
        weapon_skill=10,
        ballistic_skill=0,
        strength=0,
        toughness=10,
        agility=5,
        intelligence=0,
        willpower=0,
        fellowship=5,
        attacks=0,
        wounds=0,
        movement=0,
        insanity_points=0,
        fate_points=0,
    )
    # weapon_skill is above base (30) + career cap (10) = 40
    total_attributes = _create_attributes(weapon_skill=41, fellowship=28, toughness=41, agility=33)

    career = _create_career_with_attributes("Mercenaire", career_attributes)
    playable_character = _create_playable_character(base_attributes, total_attributes)
    session_fixture.add(playable_character)

    with pytest.raises(ValueError, match="above cap"):
        validate_playable_character_total_attributes(playable_character, current_career=career)
    session_fixture.rollback()

def test_total_attributes_below_base_raise_error(session_fixture):
    base_attributes = _create_attributes()
    # weapon_skill below base should fail even without any career
    total_attributes = _create_attributes(weapon_skill=29)

    playable_character = _create_playable_character(base_attributes, total_attributes)

    with pytest.raises(ValueError, match="below base"):
        validate_playable_character_total_attributes(playable_character)


def test_removing_career_link_validates_cap(session_fixture):
    base_attributes = _create_attributes()
    career_attributes = _create_attributes(
        weapon_skill=10,
        ballistic_skill=0,
        strength=0,
        toughness=10,
        agility=5,
        intelligence=0,
        willpower=0,
        fellowship=5,
        attacks=0,
        wounds=0,
        movement=0,
        insanity_points=0,
        fate_points=0,
    )
    total_attributes = _create_attributes(
        weapon_skill=40,
        ballistic_skill=25,
        strength=35,
        toughness=41,
        agility=33,
        intelligence=27,
        willpower=32,
        fellowship=28,
        attacks=1,
        wounds=12,
        movement=4,
        insanity_points=0,
        fate_points=0,
    )

    career = _create_career_with_attributes("Capitaine", career_attributes)
    playable_character = _create_playable_character(base_attributes, total_attributes)
    session_fixture.add(base_attributes)
    session_fixture.add(total_attributes)
    session_fixture.add(career)
    session_fixture.add(playable_character)
    session_fixture.commit()

    link = build_playable_character_career_link_with_next_order(
        session_fixture,
        playable_character.id,
        career.id,
    )
    session_fixture.add(link)
    session_fixture.commit()

    session_fixture.delete(link)
    session_fixture.commit()
    session_fixture.refresh(playable_character)

    with pytest.raises(ValueError, match="above cap"):
        validate_playable_character_total_attributes(playable_character)


def test_only_highest_order_career_is_used_for_cap(session_fixture):
    base_attributes = _create_attributes()

    old_career_attributes = _create_attributes(
        weapon_skill=10,
        ballistic_skill=0,
        strength=0,
        toughness=0,
        agility=0,
        intelligence=0,
        willpower=0,
        fellowship=0,
        attacks=0,
        wounds=0,
        movement=0,
        insanity_points=0,
        fate_points=0,
    )
    current_career_attributes = _create_attributes(
        weapon_skill=5,
        ballistic_skill=0,
        strength=0,
        toughness=0,
        agility=0,
        intelligence=0,
        willpower=0,
        fellowship=0,
        attacks=0,
        wounds=0,
        movement=0,
        insanity_points=0,
        fate_points=0,
    )

    # This value is <= base + old + current (45) but > base + current (35).
    total_attributes = _create_attributes(weapon_skill=38)

    old_career = _create_career_with_attributes("Ancienne carriere", old_career_attributes)
    current_career = _create_career_with_attributes("Carriere actuelle", current_career_attributes)

    playable_character = _create_playable_character(base_attributes, total_attributes)

    session_fixture.add(base_attributes)
    session_fixture.add(total_attributes)
    session_fixture.add(old_career)
    session_fixture.add(current_career)
    session_fixture.add(playable_character)
    session_fixture.commit()

    old_link = PlayableCharacterCareerLinkTable(
        playable_character_id=playable_character.id,
        career_id=old_career.id,
        order=0,
    )
    current_link = PlayableCharacterCareerLinkTable(
        playable_character_id=playable_character.id,
        career_id=current_career.id,
        order=1,
    )
    session_fixture.add(old_link)
    session_fixture.add(current_link)
    session_fixture.commit()

    current_career = get_current_career_for_character(session_fixture, playable_character.id)
    assert current_career is not None
    assert current_career.id == current_link.career_id

    with pytest.raises(ValueError, match="above cap"):
        validate_playable_character_total_attributes(playable_character, current_career=current_career)


def test_career_order_unique_per_character(session_fixture):
    base_attributes = _create_attributes()
    total_attributes = _create_attributes()
    career_a = _create_career_with_attributes("Carriere A", _create_attributes())
    career_b = _create_career_with_attributes("Carriere B", _create_attributes())
    playable_character = _create_playable_character(base_attributes, total_attributes)

    session_fixture.add(base_attributes)
    session_fixture.add(total_attributes)
    session_fixture.add(career_a)
    session_fixture.add(career_b)
    session_fixture.add(playable_character)
    session_fixture.commit()

    session_fixture.add(
        PlayableCharacterCareerLinkTable(
            playable_character_id=playable_character.id,
            career_id=career_a.id,
            order=0,
        )
    )
    session_fixture.add(
        PlayableCharacterCareerLinkTable(
            playable_character_id=playable_character.id,
            career_id=career_b.id,
            order=0,
        )
    )

    with pytest.raises(IntegrityError):
        session_fixture.commit()
    session_fixture.rollback()


def test_next_career_order_auto_increment_helper(session_fixture):
    base_attributes = _create_attributes()
    total_attributes = _create_attributes()
    career_a = _create_career_with_attributes("Carriere C", _create_attributes())
    career_b = _create_career_with_attributes("Carriere D", _create_attributes())
    playable_character = _create_playable_character(base_attributes, total_attributes)

    session_fixture.add(base_attributes)
    session_fixture.add(total_attributes)
    session_fixture.add(career_a)
    session_fixture.add(career_b)
    session_fixture.add(playable_character)
    session_fixture.commit()

    assert get_next_playable_character_career_order(session_fixture, playable_character.id) == 0

    first_link = build_playable_character_career_link_with_next_order(session_fixture, playable_character.id, career_a.id)
    session_fixture.add(first_link)
    session_fixture.commit()

    assert get_next_playable_character_career_order(session_fixture, playable_character.id) == 1

    second_link = build_playable_character_career_link_with_next_order(session_fixture, playable_character.id, career_b.id)
    session_fixture.add(second_link)
    session_fixture.commit()

    assert first_link.order == 0
    assert second_link.order == 1
