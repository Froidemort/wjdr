import pytest

from wjdr.models.models import Money

@pytest.mark.unitary
@pytest.mark.parametrize(
    "input_gc, input_sp, input_cc, expected_gc, expected_sp, expected_cc, id",
    [
        (1, 19, 11, 1, 19, 11, "no_coercion_needed"),
        (1, 19, 20, 2, 0, 8, "copper_to_silver_and_gold"),
        (1, 40, 0, 3, 0, 0, "silver_to_gold"),
        (0, 0, 50, 0, 4, 2, "copper_to_silver"),
        (0, 0, 300, 1, 5, 0, "large_copper_to_gold_and_silver"),
    ]
)
def test_coerce_money(input_gc, input_sp, input_cc, expected_gc, expected_sp, expected_cc, id):
    m = Money(golden_crown=1, silver_pistol=19, copper_coins=11)
    gc, sp, cc = m.coerce_money(input_gc, input_sp, input_cc)
    assert (gc, sp, cc) == (expected_gc, expected_sp, expected_cc), f"Failed test: {id}"

@pytest.mark.unitary
def test_money_validation():
    m = Money(golden_crown=1, silver_pistol=19, copper_coins=11)
    assert m.golden_crown == 1
    assert m.silver_pistol == 19
    assert m.copper_coins == 11
    m.copper_coins += 20
    assert m.golden_crown == 2

@pytest.mark.functional
def test_money_validation_coercer():
    m = Money(golden_crown=0, silver_pistol=0, copper_coins=250)
    assert m.golden_crown == 1
    assert m.silver_pistol == 0
    assert m.copper_coins == 10