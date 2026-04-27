import pytest

from wjdr.models import DicePoolTable, DiceTable, SpellCategoryTable, SpellTable


@pytest.fixture(scope="session")
def spell_category(session_fixture):
    category = SpellCategoryTable(name="Test Category", description="A test category")
    session_fixture.add(category)
    session_fixture.commit()
    yield category


@pytest.fixture(scope="session")
def spell(session_fixture, spell_category):
    dice = DiceTable(faces=10, quantity=1)
    dice_pool = DicePoolTable(modifier=0, dices=[dice])
    # Store data
    session_fixture.add(dice)
    session_fixture.add(dice_pool)
    session_fixture.commit()

    spell = SpellTable(name="Test Spell", description="A test spell", category=spell_category, difficulty=5, damage=dice_pool)
    session_fixture.add(spell)
    session_fixture.commit()
    yield spell


@pytest.mark.unitary
def test_spell_category(spell_category):
    assert spell_category.id is not None
    assert spell_category.name == "Test Category"
    assert spell_category.description == "A test category"


@pytest.mark.unitary
def test_spell(spell, spell_category):
    assert spell.id is not None
    assert spell.name == "Test Spell"
    assert spell.description == "A test spell"
    assert spell.category_id == spell_category.id
    assert spell.category.name == "Test Category"
    assert spell.category.description == "A test category"
    assert spell.difficulty == 5
    assert spell.damage.dices[0].faces == 10
    assert spell.damage.dices[0].quantity == 1
    assert spell.damage.modifier == 0
