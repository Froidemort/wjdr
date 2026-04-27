import pytest

from wjdr.models import DicePoolTable, DiceTable


@pytest.fixture(scope="session")
def dice6(session_fixture):
    dice = DiceTable(faces=6, quantity=1)
    session_fixture.add(dice)
    session_fixture.commit()
    yield dice


@pytest.fixture(scope="session")
def dice10(session_fixture):
    dice = DiceTable(faces=10, quantity=1)
    session_fixture.add(dice)
    session_fixture.commit()
    yield dice


@pytest.mark.unitary
def test_dice(dice6):
    assert dice6.id is not None
    assert dice6.faces == 6
    assert dice6.quantity == 1


@pytest.mark.unitary
def test_dice_pool(session_fixture, dice10):
    dice_pool = DicePoolTable(modifier=-3, dices=[dice10])
    session_fixture.add(dice_pool)
    session_fixture.commit()
    assert dice_pool.id is not None
    assert dice_pool.modifier == -3
    assert len(dice_pool.dices) == 1
    assert dice_pool.dices[0].faces == 10

def test_dice_from_string():
    dice = DiceTable.from_string("2d6")
    assert dice.faces == 6
    assert dice.quantity == 2

    dice = DiceTable.from_string("1d10")
    assert dice.faces == 10
    assert dice.quantity == 1

    with pytest.raises(ValueError):
        DiceTable.from_string("2d16+9")

def test_dice_pool_from_string():
    dice_pool = DicePoolTable.from_string("2d6+1d10-3")
    assert dice_pool.modifier == -3
    assert len(dice_pool.dices) == 2
    faces_quantity = {dice.faces: dice.quantity for dice in dice_pool.dices}
    assert faces_quantity[6] == 2
    assert faces_quantity[10] == 1
    dice_pool = DicePoolTable.from_string("1d8+1d10+5")
    assert dice_pool.modifier == 5
    assert len(dice_pool.dices) == 2
    faces_quantity = {dice.faces: dice.quantity for dice in dice_pool.dices}
    assert faces_quantity[8] == 1
    assert faces_quantity[10] == 1
    dice_pool = DicePoolTable.from_string("3d4+BF")
    assert dice_pool.modifier == 0
    assert dice_pool.dynamic_modifier == "BF"
    assert len(dice_pool.dices) == 1
    faces_quantity = {dice.faces: dice.quantity for dice in dice_pool.dices}
    assert faces_quantity[4] == 3
