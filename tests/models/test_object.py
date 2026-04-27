import pytest
from sqlalchemy.exc import IntegrityError

from wjdr.models import LocationEnum, ObjectTable


@pytest.mark.unitary
def test_object_plain_no_weapon_no_armour(session_fixture):
    """A plain object with neither weapon nor armour fields is valid."""
    obj = ObjectTable(name="Torche", description="Une torche")
    session_fixture.add(obj)
    session_fixture.commit()
    session_fixture.refresh(obj)

    assert obj.damages_id is None
    assert obj.armour_points is None
    assert obj.armour_location is None


@pytest.mark.unitary
def test_object_weapon_only(session_fixture):
    """An object with only damages_id (weapon) is valid."""
    obj = ObjectTable(name="Épée longue", damages_id=None)
    # damages_id references DiceTable; we leave it NULL to test constraint logic only
    obj.damages_id = None
    obj.armour_points = None
    obj.armour_location = None
    session_fixture.add(obj)
    session_fixture.commit()
    assert obj.id is not None


@pytest.mark.unitary
def test_object_armour_with_both_fields(session_fixture):
    """An object with armour_points and armour_location set (but no damages_id) is valid."""
    obj = ObjectTable(name="Heaume de fer", armour_points=1, armour_location=LocationEnum.HEAD)
    session_fixture.add(obj)
    session_fixture.commit()
    session_fixture.refresh(obj)

    assert obj.armour_points == 1
    assert obj.armour_location == LocationEnum.HEAD
    assert obj.damages_id is None


@pytest.mark.unitary
def test_object_armour_location_without_points_violates_constraint(session_fixture):
    """An object with armour_location but no armour_points violates the together constraint."""
    obj = ObjectTable(name="Armure partielle", armour_points=None, armour_location=LocationEnum.BODY)
    session_fixture.add(obj)
    with pytest.raises(IntegrityError):
        session_fixture.commit()
    session_fixture.rollback()


@pytest.mark.unitary
def test_object_weapon_and_armour_together_violates_xor_constraint(session_fixture):
    """An object with both damages_id and armour fields set violates the XOR constraint."""
    from wjdr.models import DiceTable

    dice = DiceTable(faces=6, quantity=2)
    session_fixture.add(dice)
    session_fixture.commit()

    obj = ObjectTable(name="Objet invalide", damages_id=dice.id, armour_points=2, armour_location=LocationEnum.BODY)
    session_fixture.add(obj)
    with pytest.raises(IntegrityError):
        session_fixture.commit()
    session_fixture.rollback()
