import pytest

from wjdr.models import DicePoolDiceLinkTable, DicePoolTable, DiceTable


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
def test_dice_pool(session_fixture, dice6, dice10):
    dice_pool = DicePoolTable(modifier=-3)
    session_fixture.add(dice_pool)
    session_fixture.commit()
    assert dice_pool.id is not None
    assert dice_pool.modifier == -3

    dices1 = DiceTable(faces=dice6.faces, quantity=2)
    session_fixture.add(dices1)
    session_fixture.commit()

    dices2 = DiceTable(faces=dice10.faces, quantity=1)
    session_fixture.add(dices2)
    session_fixture.commit()

    dice_pool_dices1 = DicePoolDiceLinkTable(dice_pool_id=dice_pool.id, dices_id=dices1.id)
    session_fixture.add(dice_pool_dices1)
    session_fixture.commit()

    dice_pool_dices2 = DicePoolDiceLinkTable(dice_pool_id=dice_pool.id, dices_id=dices2.id)
    session_fixture.add(dice_pool_dices2)
    session_fixture.commit()

    assert dice_pool_dices1.dice_pool_id == dice_pool.id
    assert dice_pool_dices1.dices_id == dices1.id

    assert dice_pool_dices2.dice_pool_id == dice_pool.id
    assert dice_pool_dices2.dices_id == dices2.id

@pytest.mark.unitary
def test_dice_pool_roll(session_fixture, dice10, dice6):
    dice_table = DiceTable(faces=dice10.faces, quantity=2)
    dice_pool_table = DicePoolTable(modifier=20)
    session_fixture.add(dice_table)
    session_fixture.add(dice_pool_table)
    session_fixture.commit()

    dice_pool_dices_table = DicePoolDiceLinkTable(dice_pool_id=dice_pool_table.id, dices_id=dice_table.id)
    session_fixture.add(dice_pool_dices_table)
    session_fixture.commit()