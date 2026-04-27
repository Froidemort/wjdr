import pytest

from wjdr.models import CurrencyTable


@pytest.mark.unitary
def test_currency_coercion_no_overflow(session_fixture):
    """A currency with values already in canonical form is left unchanged."""
    currency = CurrencyTable(gold_crowns=1, silver_shillings=5, brass_pennies=3)
    session_fixture.add(currency)
    session_fixture.commit()
    session_fixture.refresh(currency)

    assert currency.gold_crowns == 1
    assert currency.silver_shillings == 5
    assert currency.brass_pennies == 3


@pytest.mark.unitary
def test_currency_coercion_shillings_overflow(session_fixture):
    """Excess silver shillings are promoted to gold crowns."""
    # 25 shillings = 1 crown + 5 shillings
    currency = CurrencyTable(gold_crowns=0, silver_shillings=25, brass_pennies=0)
    session_fixture.add(currency)
    session_fixture.commit()
    session_fixture.refresh(currency)

    assert currency.gold_crowns == 1
    assert currency.silver_shillings == 5
    assert currency.brass_pennies == 0


@pytest.mark.unitary
def test_currency_coercion_pennies_overflow(session_fixture):
    """Excess brass pennies are promoted to silver shillings (and then gold crowns)."""
    # 250 brass = 1 crown (240) + 10 brass = 1 crown + 0 shillings + 10 pennies
    currency = CurrencyTable(gold_crowns=0, silver_shillings=0, brass_pennies=250)
    session_fixture.add(currency)
    session_fixture.commit()
    session_fixture.refresh(currency)

    assert currency.gold_crowns == 1
    assert currency.silver_shillings == 0
    assert currency.brass_pennies == 10


@pytest.mark.unitary
def test_currency_coercion_mixed_overflow(session_fixture):
    """All denominations overflow and are normalized together."""
    # 2 crowns + 25 shillings + 15 brass
    # = 2*240 + 25*12 + 15 = 480 + 300 + 15 = 795 brass
    # 795 // 240 = 3 crowns, 795 % 240 = 75 remaining
    # 75 // 12 = 6 shillings, 75 % 12 = 3 pennies
    currency = CurrencyTable(gold_crowns=2, silver_shillings=25, brass_pennies=15)
    session_fixture.add(currency)
    session_fixture.commit()
    session_fixture.refresh(currency)

    assert currency.gold_crowns == 3
    assert currency.silver_shillings == 6
    assert currency.brass_pennies == 3


@pytest.mark.unitary
def test_currency_coercion_on_update(session_fixture):
    """The coercion also fires on update."""
    currency = CurrencyTable(gold_crowns=0, silver_shillings=0, brass_pennies=0)
    session_fixture.add(currency)
    session_fixture.commit()

    currency.silver_shillings = 24  # 24 shillings = 1 crown + 4 shillings
    session_fixture.add(currency)
    session_fixture.commit()
    session_fixture.refresh(currency)

    assert currency.gold_crowns == 1
    assert currency.silver_shillings == 4
    assert currency.brass_pennies == 0
