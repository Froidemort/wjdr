import uuid

import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from wjdr.models import (
    AttributesTable,
    CapacityTable,
    CareerCapacityGroupTable,
    CareerEquipmentGroupOptionLinkTable,
    CareerEquipmentGroupTable,
    CareerTable,
    CategoryEnum,
    DicePoolTable,
    DiceTable,
    EquipmentTable,
    NonPlayableCharacterSpoilLinkTable,
    NonPlayableCharacterTable,
    ObjectTable,
)

pytestmark = pytest.mark.unitary


def _create_career(name: str) -> CareerTable:
    return CareerTable(name=name, description="Test career", is_basic=True)


def _create_capacity(name: str, specialization: str | None = None) -> CapacityTable:
    return CapacityTable(name=name, specialization=specialization, category=CategoryEnum.SKILL)


def _create_equipment(session_fixture, name: str, quantity: int = 1) -> EquipmentTable:
    object_table = ObjectTable(name=name)
    session_fixture.add(object_table)
    session_fixture.flush()
    return EquipmentTable(object_id=object_table.id, quantity=quantity)


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


def _get_or_create_dice(session_fixture, faces: int = 10, quantity: int = 1) -> DiceTable:
    dice = session_fixture.exec(select(DiceTable).where(DiceTable.faces == faces, DiceTable.quantity == quantity)).first()
    if dice is not None:
        return dice

    dice = DiceTable(faces=faces, quantity=quantity)
    session_fixture.add(dice)
    session_fixture.flush()
    return dice


def test_career_capacity_group_single_explicit_capacity(session_fixture):
    career = _create_career(f"career-{uuid.uuid4()}")
    survival = _create_capacity("Survie")
    group = CareerCapacityGroupTable(career=career, pick_count=1, any_specialization=False)
    group.options.append(survival)

    session_fixture.add(career)
    session_fixture.add(survival)
    session_fixture.add(group)
    session_fixture.commit()
    session_fixture.refresh(career)

    assert len(career.capacity_groups) == 1
    assert career.capacity_groups[0].pick_count == 1
    assert career.capacity_groups[0].any_specialization is False
    assert [option.name for option in career.capacity_groups[0].options] == ["Survie"]


def test_career_capacity_group_choose_one_among_known_options(session_fixture):
    career = _create_career(f"career-{uuid.uuid4()}")
    survival = _create_capacity("Survie")
    resilient = _create_capacity("Résistant")
    robust = _create_capacity("Robuste")
    group = CareerCapacityGroupTable(career=career, pick_count=1, any_specialization=False)
    group.options.extend([survival, resilient, robust])

    session_fixture.add(career)
    session_fixture.add(survival)
    session_fixture.add(resilient)
    session_fixture.add(robust)
    session_fixture.add(group)
    session_fixture.commit()
    session_fixture.refresh(career)

    assert len(career.capacity_groups) == 1
    assert career.capacity_groups[0].pick_count == 1
    assert {option.name for option in career.capacity_groups[0].options} == {"Survie", "Résistant", "Robuste"}


def test_career_capacity_group_choose_many_among_known_options(session_fixture):
    career = _create_career(f"career-{uuid.uuid4()}")
    options = [
        _create_capacity("Tir précis"),
        _create_capacity("Tir puissant"),
        _create_capacity("Coup puissant"),
        _create_capacity("Coup assommant"),
    ]
    group = CareerCapacityGroupTable(career=career, pick_count=2, any_specialization=False)
    group.options.extend(options)

    session_fixture.add(career)
    for option in options:
        session_fixture.add(option)
    session_fixture.add(group)
    session_fixture.commit()
    session_fixture.refresh(career)

    assert len(career.capacity_groups) == 1
    assert career.capacity_groups[0].pick_count == 2
    assert len(career.capacity_groups[0].options) == 4


def test_career_capacity_group_any_specialization_flag(session_fixture):
    career = _create_career(f"career-{uuid.uuid4()}")
    base_knowledge = _create_capacity("Connaissances générales")
    group = CareerCapacityGroupTable(career=career, pick_count=1, any_specialization=True)
    group.options.append(base_knowledge)

    session_fixture.add(career)
    session_fixture.add(base_knowledge)
    session_fixture.add(group)
    session_fixture.commit()
    session_fixture.refresh(career)

    assert len(career.capacity_groups) == 1
    assert career.capacity_groups[0].any_specialization is True
    assert [option.name for option in career.capacity_groups[0].options] == ["Connaissances générales"]


def test_career_trapping_group_choose_one_among_known_options(session_fixture):
    career = _create_career(f"career-{uuid.uuid4()}")
    torch = _create_equipment(session_fixture, "Torche")
    anti_poison_kit = _create_equipment(session_fixture, "Nécessaire anti-poison")

    group = CareerEquipmentGroupTable(career=career, pick_count=1)

    session_fixture.add(career)
    session_fixture.add(torch)
    session_fixture.add(anti_poison_kit)
    session_fixture.add(group)
    session_fixture.commit()
    session_fixture.add(
        CareerEquipmentGroupOptionLinkTable(
            career_equipment_group_id=group.id,
            equipment_id=torch.id,
            fixed_quantity=1,
        )
    )
    session_fixture.add(
        CareerEquipmentGroupOptionLinkTable(
            career_equipment_group_id=group.id,
            equipment_id=anti_poison_kit.id,
            fixed_quantity=1,
        )
    )
    session_fixture.commit()
    session_fixture.refresh(career)

    assert len(career.trapping_groups) == 1
    assert career.trapping_groups[0].pick_count == 1
    assert len(career.trapping_groups[0].options) == 2


def test_career_trapping_group_random_quantity_dice_pool(session_fixture):
    career = _create_career(f"career-{uuid.uuid4()}")
    political_leaflets = _create_equipment(session_fixture, "Tracts politiques", quantity=1)
    dice = _get_or_create_dice(session_fixture)
    dice_pool = DicePoolTable(dices=[dice])

    group = CareerEquipmentGroupTable(career=career, pick_count=1)

    session_fixture.add(career)
    session_fixture.add(political_leaflets)
    session_fixture.add(dice_pool)
    session_fixture.add(group)
    session_fixture.commit()
    session_fixture.refresh(group)

    link = CareerEquipmentGroupOptionLinkTable(
        career_equipment_group_id=group.id,
        equipment_id=political_leaflets.id,
        fixed_quantity=None,
        random_quantity_dice_pool_id=dice_pool.id,
    )
    session_fixture.add(link)
    session_fixture.commit()

    fetched_link = session_fixture.exec(
        select(CareerEquipmentGroupOptionLinkTable).where(
            CareerEquipmentGroupOptionLinkTable.career_equipment_group_id == group.id,
            CareerEquipmentGroupOptionLinkTable.equipment_id == political_leaflets.id,
        )
    ).one()

    assert fetched_link.random_quantity_dice_pool_id == dice_pool.id
    assert fetched_link.random_quantity_dice_pool is not None
    assert str(fetched_link.random_quantity_dice_pool) == "1d10"
    assert fetched_link.fixed_quantity is None
    session_fixture.refresh(group)
    assert [option.object.name for option in group.options] == ["Tracts politiques"]


def test_career_trapping_group_quantity_xor_constraint(session_fixture):
    career = _create_career(f"career-{uuid.uuid4()}")
    arrows = _create_equipment(session_fixture, "Flèches")
    dice = _get_or_create_dice(session_fixture)
    dice_pool = DicePoolTable(dices=[dice])
    group = CareerEquipmentGroupTable(career=career, pick_count=1)

    session_fixture.add(career)
    session_fixture.add(arrows)
    session_fixture.add(dice_pool)
    session_fixture.add(group)
    session_fixture.commit()
    session_fixture.refresh(group)

    invalid_link = CareerEquipmentGroupOptionLinkTable(
        career_equipment_group_id=group.id,
        equipment_id=arrows.id,
        fixed_quantity=5,
        random_quantity_dice_pool_id=dice_pool.id,
    )

    session_fixture.add(invalid_link)
    with pytest.raises(IntegrityError):
        session_fixture.commit()
    session_fixture.rollback()


def test_npc_spoils_can_use_random_quantity_dice_pool(session_fixture):
    attributes = _create_attributes()
    npc = NonPlayableCharacterTable(name=f"npc-{uuid.uuid4()}", attributes=attributes)
    loot = _create_equipment(session_fixture, "Pièces")
    dice = _get_or_create_dice(session_fixture)
    dice_pool = DicePoolTable(dices=[dice])

    session_fixture.add(attributes)
    session_fixture.add(npc)
    session_fixture.add(loot)
    session_fixture.add(dice_pool)
    session_fixture.commit()

    spoil_link = NonPlayableCharacterSpoilLinkTable(
        non_playable_character_id=npc.id,
        equipment_id=loot.id,
        fixed_quantity=None,
        random_quantity_dice_pool_id=dice_pool.id,
    )
    session_fixture.add(spoil_link)
    session_fixture.commit()

    fetched_spoil_link = session_fixture.exec(
        select(NonPlayableCharacterSpoilLinkTable).where(
            NonPlayableCharacterSpoilLinkTable.non_playable_character_id == npc.id,
            NonPlayableCharacterSpoilLinkTable.equipment_id == loot.id,
        )
    ).one()

    assert fetched_spoil_link.random_quantity_dice_pool_id == dice_pool.id
    assert fetched_spoil_link.random_quantity_dice_pool is not None
    assert str(fetched_spoil_link.random_quantity_dice_pool) == "1d10"
