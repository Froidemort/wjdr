"""Tests for equipment reward groups on ScenarioTable and ChapterTable."""

import uuid

import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from wjdr.models import (
    CampaignTable,
    ChapterRewardGroupOptionLinkTable,
    ChapterRewardGroupTable,
    ChapterTable,
    DicePoolTable,
    DiceTable,
    EquipmentTable,
    ObjectTable,
    ScenarioRewardGroupOptionLinkTable,
    ScenarioRewardGroupTable,
    ScenarioTable,
)

pytestmark = pytest.mark.unitary


# ==================
# Helpers
# ==================


def _make_scenario(session_fixture) -> ScenarioTable:
    campaign = CampaignTable(name=f"campaign-{uuid.uuid4()}")
    scenario = ScenarioTable(name=f"scenario-{uuid.uuid4()}", campaign=campaign)
    session_fixture.add(campaign)
    session_fixture.add(scenario)
    session_fixture.commit()
    return scenario


def _make_chapter(session_fixture) -> ChapterTable:
    scenario = _make_scenario(session_fixture)
    chapter = ChapterTable(name=f"chapter-{uuid.uuid4()}", scenario=scenario)
    session_fixture.add(chapter)
    session_fixture.commit()
    return chapter


def _make_equipment(session_fixture, name: str, quantity: int = 1) -> EquipmentTable:
    obj = ObjectTable(name=name)
    session_fixture.add(obj)
    session_fixture.flush()
    equipment = EquipmentTable(object_id=obj.id, quantity=quantity)
    session_fixture.add(equipment)
    session_fixture.commit()
    return equipment


def _get_or_create_dice(session_fixture, faces: int = 10, quantity: int = 1) -> DiceTable:
    dice = session_fixture.exec(select(DiceTable).where(DiceTable.faces == faces, DiceTable.quantity == quantity)).first()
    if dice is not None:
        return dice

    dice = DiceTable(faces=faces, quantity=quantity)
    session_fixture.add(dice)
    session_fixture.flush()
    return dice


def _make_dice_pool(session_fixture) -> DicePoolTable:
    dice = _get_or_create_dice(session_fixture)
    dice_pool = DicePoolTable(dices=[dice])
    session_fixture.add(dice_pool)
    session_fixture.commit()
    return dice_pool


# ==================
# Scenario reward group tests
# ==================


def test_scenario_reward_group_fixed_quantity(session_fixture):
    """A reward group on a scenario with a fixed quantity item is persisted and navigable."""
    scenario = _make_scenario(session_fixture)
    sword = _make_equipment(session_fixture, "Épée longue")
    group = ScenarioRewardGroupTable(scenario=scenario, pick_count=1)
    session_fixture.add(group)
    session_fixture.commit()

    link = ScenarioRewardGroupOptionLinkTable(
        scenario_reward_group_id=group.id,
        equipment_id=sword.id,
        fixed_quantity=1,
    )
    session_fixture.add(link)
    session_fixture.commit()
    session_fixture.refresh(scenario)

    assert len(scenario.reward_groups) == 1
    assert scenario.reward_groups[0].pick_count == 1
    assert len(scenario.reward_groups[0].options) == 1
    assert scenario.reward_groups[0].options[0].object.name == "Épée longue"


def test_scenario_reward_group_random_quantity_dice_pool(session_fixture):
    """A reward group option with a dice pool quantity is persisted and the dice pool is navigable."""
    scenario = _make_scenario(session_fixture)
    gold_coins = _make_equipment(session_fixture, "Pièces d'or")
    dice_pool = _make_dice_pool(session_fixture)

    group = ScenarioRewardGroupTable(scenario=scenario, pick_count=1)
    session_fixture.add(group)
    session_fixture.commit()

    link = ScenarioRewardGroupOptionLinkTable(
        scenario_reward_group_id=group.id,
        equipment_id=gold_coins.id,
        fixed_quantity=None,
        random_quantity_dice_pool_id=dice_pool.id,
    )
    session_fixture.add(link)
    session_fixture.commit()

    fetched = session_fixture.exec(
        select(ScenarioRewardGroupOptionLinkTable).where(
            ScenarioRewardGroupOptionLinkTable.scenario_reward_group_id == group.id,
            ScenarioRewardGroupOptionLinkTable.equipment_id == gold_coins.id,
        )
    ).one()

    assert fetched.fixed_quantity is None
    assert fetched.random_quantity_dice_pool_id == dice_pool.id
    assert str(fetched.random_quantity_dice_pool) == "1d10"


def test_scenario_reward_group_pick_count_multiple_options(session_fixture):
    """A reward group with pick_count > 1 and multiple options is supported."""
    scenario = _make_scenario(session_fixture)
    items = [_make_equipment(session_fixture, f"Objet scénario {i}") for i in range(3)]
    group = ScenarioRewardGroupTable(scenario=scenario, pick_count=2)
    session_fixture.add(group)
    session_fixture.commit()

    for item in items:
        session_fixture.add(ScenarioRewardGroupOptionLinkTable(scenario_reward_group_id=group.id, equipment_id=item.id, fixed_quantity=1))
    session_fixture.commit()
    session_fixture.refresh(group)

    assert group.pick_count == 2
    assert len(group.options) == 3


def test_scenario_reward_group_multiple_groups(session_fixture):
    """A scenario can have several independent reward groups."""
    scenario = _make_scenario(session_fixture)
    item_a = _make_equipment(session_fixture, "Potion de soin")
    item_b = _make_equipment(session_fixture, "Parchemin magique")

    group_a = ScenarioRewardGroupTable(scenario=scenario, pick_count=1)
    group_b = ScenarioRewardGroupTable(scenario=scenario, pick_count=1)
    session_fixture.add(group_a)
    session_fixture.add(group_b)
    session_fixture.commit()

    session_fixture.add(ScenarioRewardGroupOptionLinkTable(scenario_reward_group_id=group_a.id, equipment_id=item_a.id, fixed_quantity=1))
    session_fixture.add(ScenarioRewardGroupOptionLinkTable(scenario_reward_group_id=group_b.id, equipment_id=item_b.id, fixed_quantity=1))
    session_fixture.commit()
    session_fixture.refresh(scenario)

    assert len(scenario.reward_groups) == 2


def test_scenario_reward_group_xor_constraint_both_set(session_fixture):
    """Setting both fixed_quantity and random_quantity_dice_pool_id raises IntegrityError."""
    scenario = _make_scenario(session_fixture)
    item = _make_equipment(session_fixture, "Gemme précieuse")
    dice_pool = _make_dice_pool(session_fixture)
    group = ScenarioRewardGroupTable(scenario=scenario, pick_count=1)
    session_fixture.add(group)
    session_fixture.commit()

    invalid_link = ScenarioRewardGroupOptionLinkTable(
        scenario_reward_group_id=group.id,
        equipment_id=item.id,
        fixed_quantity=2,
        random_quantity_dice_pool_id=dice_pool.id,
    )
    session_fixture.add(invalid_link)
    with pytest.raises(IntegrityError):
        session_fixture.commit()
    session_fixture.rollback()


def test_scenario_reward_group_xor_constraint_none_set(session_fixture):
    """Setting neither fixed_quantity nor random_quantity_dice_pool_id raises IntegrityError."""
    scenario = _make_scenario(session_fixture)
    item = _make_equipment(session_fixture, "Bague enchantée")
    group = ScenarioRewardGroupTable(scenario=scenario, pick_count=1)
    session_fixture.add(group)
    session_fixture.commit()

    invalid_link = ScenarioRewardGroupOptionLinkTable(
        scenario_reward_group_id=group.id,
        equipment_id=item.id,
        fixed_quantity=None,
        random_quantity_dice_pool_id=None,
    )
    session_fixture.add(invalid_link)
    with pytest.raises(IntegrityError):
        session_fixture.commit()
    session_fixture.rollback()


# ==================
# Chapter reward group tests
# ==================


def test_chapter_reward_group_fixed_quantity(session_fixture):
    """A reward group on a chapter with a fixed quantity item is persisted and navigable."""
    chapter = _make_chapter(session_fixture)
    armor = _make_equipment(session_fixture, "Armure de cuir")
    group = ChapterRewardGroupTable(chapter=chapter, pick_count=1)
    session_fixture.add(group)
    session_fixture.commit()

    link = ChapterRewardGroupOptionLinkTable(
        chapter_reward_group_id=group.id,
        equipment_id=armor.id,
        fixed_quantity=1,
    )
    session_fixture.add(link)
    session_fixture.commit()
    session_fixture.refresh(chapter)

    assert len(chapter.reward_groups) == 1
    assert chapter.reward_groups[0].pick_count == 1
    assert len(chapter.reward_groups[0].options) == 1
    assert chapter.reward_groups[0].options[0].object.name == "Armure de cuir"


def test_chapter_reward_group_random_quantity_dice_pool(session_fixture):
    """A reward group option on a chapter with a dice pool quantity is navigable."""
    chapter = _make_chapter(session_fixture)
    silver_coins = _make_equipment(session_fixture, "Pièces d'argent")
    dice_pool = _make_dice_pool(session_fixture)

    group = ChapterRewardGroupTable(chapter=chapter, pick_count=1)
    session_fixture.add(group)
    session_fixture.commit()

    link = ChapterRewardGroupOptionLinkTable(
        chapter_reward_group_id=group.id,
        equipment_id=silver_coins.id,
        fixed_quantity=None,
        random_quantity_dice_pool_id=dice_pool.id,
    )
    session_fixture.add(link)
    session_fixture.commit()

    fetched = session_fixture.exec(
        select(ChapterRewardGroupOptionLinkTable).where(
            ChapterRewardGroupOptionLinkTable.chapter_reward_group_id == group.id,
            ChapterRewardGroupOptionLinkTable.equipment_id == silver_coins.id,
        )
    ).one()

    assert fetched.fixed_quantity is None
    assert fetched.random_quantity_dice_pool_id == dice_pool.id
    assert str(fetched.random_quantity_dice_pool) == "1d10"


def test_chapter_reward_group_pick_count_multiple_options(session_fixture):
    """A chapter reward group with pick_count > 1 and multiple options is supported."""
    chapter = _make_chapter(session_fixture)
    items = [_make_equipment(session_fixture, f"Objet chapitre {i}") for i in range(4)]
    group = ChapterRewardGroupTable(chapter=chapter, pick_count=2)
    session_fixture.add(group)
    session_fixture.commit()

    for item in items:
        session_fixture.add(ChapterRewardGroupOptionLinkTable(chapter_reward_group_id=group.id, equipment_id=item.id, fixed_quantity=1))
    session_fixture.commit()
    session_fixture.refresh(group)

    assert group.pick_count == 2
    assert len(group.options) == 4


def test_chapter_reward_group_multiple_groups(session_fixture):
    """A chapter can have several independent reward groups."""
    chapter = _make_chapter(session_fixture)
    item_a = _make_equipment(session_fixture, "Torche")
    item_b = _make_equipment(session_fixture, "Corde")

    group_a = ChapterRewardGroupTable(chapter=chapter, pick_count=1)
    group_b = ChapterRewardGroupTable(chapter=chapter, pick_count=1)
    session_fixture.add(group_a)
    session_fixture.add(group_b)
    session_fixture.commit()

    session_fixture.add(ChapterRewardGroupOptionLinkTable(chapter_reward_group_id=group_a.id, equipment_id=item_a.id, fixed_quantity=1))
    session_fixture.add(ChapterRewardGroupOptionLinkTable(chapter_reward_group_id=group_b.id, equipment_id=item_b.id, fixed_quantity=1))
    session_fixture.commit()
    session_fixture.refresh(chapter)

    assert len(chapter.reward_groups) == 2


def test_chapter_reward_group_xor_constraint_both_set(session_fixture):
    """Setting both fixed_quantity and random_quantity_dice_pool_id on a chapter reward raises IntegrityError."""
    chapter = _make_chapter(session_fixture)
    item = _make_equipment(session_fixture, "Anneau magique")
    dice_pool = _make_dice_pool(session_fixture)
    group = ChapterRewardGroupTable(chapter=chapter, pick_count=1)
    session_fixture.add(group)
    session_fixture.commit()

    invalid_link = ChapterRewardGroupOptionLinkTable(
        chapter_reward_group_id=group.id,
        equipment_id=item.id,
        fixed_quantity=3,
        random_quantity_dice_pool_id=dice_pool.id,
    )
    session_fixture.add(invalid_link)
    with pytest.raises(IntegrityError):
        session_fixture.commit()
    session_fixture.rollback()


def test_chapter_reward_group_xor_constraint_none_set(session_fixture):
    """Setting neither fixed_quantity nor random_quantity_dice_pool_id on a chapter reward raises IntegrityError."""
    chapter = _make_chapter(session_fixture)
    item = _make_equipment(session_fixture, "Carte au trésor")
    group = ChapterRewardGroupTable(chapter=chapter, pick_count=1)
    session_fixture.add(group)
    session_fixture.commit()

    invalid_link = ChapterRewardGroupOptionLinkTable(
        chapter_reward_group_id=group.id,
        equipment_id=item.id,
        fixed_quantity=None,
        random_quantity_dice_pool_id=None,
    )
    session_fixture.add(invalid_link)
    with pytest.raises(IntegrityError):
        session_fixture.commit()
    session_fixture.rollback()


# ==================
# Reverse navigation from EquipmentTable
# ==================


def test_equipment_navigable_from_scenario_reward_group(session_fixture):
    """Equipment.scenario_reward_groups navigates back to its scenario reward groups."""
    scenario = _make_scenario(session_fixture)
    item = _make_equipment(session_fixture, "Bouclier de bois")
    group = ScenarioRewardGroupTable(scenario=scenario, pick_count=1)
    session_fixture.add(group)
    session_fixture.commit()

    session_fixture.add(ScenarioRewardGroupOptionLinkTable(scenario_reward_group_id=group.id, equipment_id=item.id, fixed_quantity=1))
    session_fixture.commit()
    session_fixture.refresh(item)

    assert any(g.id == group.id for g in item.scenario_reward_groups)


def test_equipment_navigable_from_chapter_reward_group(session_fixture):
    """Equipment.chapter_reward_groups navigates back to its chapter reward groups."""
    chapter = _make_chapter(session_fixture)
    item = _make_equipment(session_fixture, "Grimoire ancien")
    group = ChapterRewardGroupTable(chapter=chapter, pick_count=1)
    session_fixture.add(group)
    session_fixture.commit()

    session_fixture.add(ChapterRewardGroupOptionLinkTable(chapter_reward_group_id=group.id, equipment_id=item.id, fixed_quantity=1))
    session_fixture.commit()
    session_fixture.refresh(item)

    assert any(g.id == group.id for g in item.chapter_reward_groups)
