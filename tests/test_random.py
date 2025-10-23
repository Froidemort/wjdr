import pytest
from wjdr.models.random import DicePool


@pytest.fixture
def basic_pool():
    return DicePool({6: 2}, 3)


@pytest.mark.unitary
def test_init_basic_pool(basic_pool):
    assert basic_pool.dices == {6: 2}
    assert basic_pool.modifier == 3


@pytest.mark.unitary
@pytest.mark.parametrize(
    "pool_str, expected_dices, expected_modifier",
    [
        ("2d6+3", {6: 2}, 3),
        ("1d8-1", {8: 1}, -1),
        ("3d10", {10: 3}, 0),
        ("1d4+0", {4: 1}, 0),
        ("5d12-7", {12: 5}, -7),
        ("2d6+1d4+2", {6: 2, 4: 1}, 2),
    ],
)
def test_from_string(pool_str, expected_dices, expected_modifier):
    pool = DicePool.from_string(pool_str)
    assert pool.dices == expected_dices
    assert pool.modifier == expected_modifier


@pytest.mark.unitary
def test_roll_returns_int_and_in_range():
    pool = DicePool({6: 2}, 3)
    result = pool.roll()
    assert isinstance(result, int)
    # 2d6+3: min=2+3=5, max=12+3=15
    assert 5 <= result <= 15


@pytest.mark.unitary
def test_roll_multiple_dice_types(fixed_seed):
    with fixed_seed:
        pool = DicePool({6: 1, 4: 2}, 0)
        result = pool.roll()
    assert result == 11


@pytest.mark.unitary
def test_roll_with_negative_modifier(fixed_seed):
    with fixed_seed:
        pool = DicePool({8: 1}, -2)
        result = pool.roll()
    assert result == 0

@pytest.mark.unitary
@pytest.mark.parametrize(
    "bad_string",
    ["abc", "a+2", "z-9"]
)
def test_invalid_from_string(bad_string):
    with pytest.raises(ValueError):
        DicePool.from_string(bad_string)