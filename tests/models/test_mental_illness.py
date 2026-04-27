import uuid

import pytest

from wjdr.models import (
    AttributesTable,
    GenderEnum,
    MentalIllnessTable,
    NonPlayableCharacterMentalIllnessLinkTable,
    NonPlayableCharacterTable,
    PlayableCharacterMentalIllnessLinkTable,
    PlayableCharacterTable,
    PlayableRaceEnum,
)


def _create_attributes() -> AttributesTable:
    return AttributesTable(
        weapon_skill=25,
        ballistic_skill=25,
        strength=25,
        toughness=25,
        agility=25,
        intelligence=25,
        willpower=25,
        fellowship=25,
        attacks=1,
        wounds=10,
        movement=4,
        insanity_points=0,
        fate_points=1,
    )


@pytest.mark.unitary
def test_create_mental_illness(session_fixture):
    """A mental illness can be created with a name and optional description."""
    illness = MentalIllnessTable(name="Paranoia", description="Le personnage voit des ennemis partout.")
    session_fixture.add(illness)
    session_fixture.commit()
    session_fixture.refresh(illness)

    assert illness.id is not None
    assert illness.name == "Paranoia"


@pytest.mark.unitary
def test_link_mental_illness_to_playable_character(session_fixture):
    """A mental illness can be linked to a playable character."""
    base_attributes = _create_attributes()
    total_attributes = _create_attributes()
    illness = MentalIllnessTable(name="Phobie des araignees")

    session_fixture.add(base_attributes)
    session_fixture.add(total_attributes)
    session_fixture.add(illness)
    session_fixture.commit()

    playable_character = PlayableCharacterTable(
        name=f"pc-{uuid.uuid4()}",
        gender=GenderEnum.OTHER,
        race=PlayableRaceEnum.HUMAN,
        base_attributes_id=base_attributes.id,
        total_attributes_id=total_attributes.id,
    )
    session_fixture.add(playable_character)
    session_fixture.commit()

    link = PlayableCharacterMentalIllnessLinkTable(playable_character_id=playable_character.id, mental_illness_id=illness.id)
    session_fixture.add(link)
    session_fixture.commit()

    session_fixture.refresh(playable_character)
    names = [mental_illness.name for mental_illness in playable_character.mental_illnesses]
    assert "Phobie des araignees" in names


@pytest.mark.unitary
def test_link_mental_illness_to_non_playable_character(session_fixture):
    """A mental illness can be linked to a non-playable character."""
    attributes = _create_attributes()
    illness = MentalIllnessTable(name="Megalomanie")

    session_fixture.add(attributes)
    session_fixture.add(illness)
    session_fixture.commit()

    non_playable_character = NonPlayableCharacterTable(name=f"npc-{uuid.uuid4()}", attributes_id=attributes.id)
    session_fixture.add(non_playable_character)
    session_fixture.commit()

    link = NonPlayableCharacterMentalIllnessLinkTable(non_playable_character_id=non_playable_character.id, mental_illness_id=illness.id)
    session_fixture.add(link)
    session_fixture.commit()

    session_fixture.refresh(non_playable_character)
    names = [mental_illness.name for mental_illness in non_playable_character.mental_illnesses]
    assert "Megalomanie" in names


@pytest.mark.unitary
def test_same_mental_illness_can_affect_playable_and_non_playable_character(session_fixture):
    """A single mental illness entry can be linked to both PC and NPC."""
    pc_base_attributes = _create_attributes()
    pc_total_attributes = _create_attributes()
    npc_attributes = _create_attributes()
    illness = MentalIllnessTable(name="Syndrome post-traumatique")

    session_fixture.add(pc_base_attributes)
    session_fixture.add(pc_total_attributes)
    session_fixture.add(npc_attributes)
    session_fixture.add(illness)
    session_fixture.commit()

    playable_character = PlayableCharacterTable(
        name=f"pc-{uuid.uuid4()}",
        gender=GenderEnum.MASCULIN,
        race=PlayableRaceEnum.ELF,
        base_attributes_id=pc_base_attributes.id,
        total_attributes_id=pc_total_attributes.id,
    )
    non_playable_character = NonPlayableCharacterTable(name=f"npc-{uuid.uuid4()}", attributes_id=npc_attributes.id)
    session_fixture.add(playable_character)
    session_fixture.add(non_playable_character)
    session_fixture.commit()

    pc_link = PlayableCharacterMentalIllnessLinkTable(playable_character_id=playable_character.id, mental_illness_id=illness.id)
    npc_link = NonPlayableCharacterMentalIllnessLinkTable(non_playable_character_id=non_playable_character.id, mental_illness_id=illness.id)
    session_fixture.add(pc_link)
    session_fixture.add(npc_link)
    session_fixture.commit()

    session_fixture.refresh(illness)
    assert len(illness.playable_characters) == 1
    assert len(illness.non_playable_characters) == 1
