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
