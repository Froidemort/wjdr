from enum import Enum, StrEnum

import pytest
import reflex as rx

from wjdr.components.forms.enum_fields import enum_radio_group, enum_select, enum_values, parse_enum_value


class SampleEnum(StrEnum):
    FIRST = "premier"
    SECOND = "deuxieme"


class LegacyStringEnum(str, Enum):
    YES = "oui"
    NO = "non"


class NonStringEnum(Enum):
    ONE = 1
    TWO = 2


@pytest.mark.gui
def test_enum_values_returns_values_in_definition_order():
    assert enum_values(SampleEnum) == ["premier", "deuxieme"]


@pytest.mark.gui
def test_parse_enum_value_returns_enum_member_for_valid_value():
    assert parse_enum_value(SampleEnum, "premier") == SampleEnum.FIRST


@pytest.mark.gui
def test_parse_enum_value_returns_none_for_empty_value():
    assert parse_enum_value(SampleEnum, "") is None


@pytest.mark.gui
def test_parse_enum_value_returns_none_for_none_value():
    assert parse_enum_value(SampleEnum, None) is None


@pytest.mark.gui
def test_parse_enum_value_raises_for_invalid_value():
    with pytest.raises(ValueError):
        parse_enum_value(SampleEnum, "invalide")


@pytest.mark.gui
def test_string_backed_legacy_enum_is_supported():
    assert enum_values(LegacyStringEnum) == ["oui", "non"]
    assert parse_enum_value(LegacyStringEnum, "oui") == LegacyStringEnum.YES


@pytest.mark.gui
def test_non_string_enum_is_rejected():
    with pytest.raises(TypeError):
        enum_values(NonStringEnum)


@pytest.mark.gui
def test_enum_select_returns_reflex_component():
    component = enum_select(SampleEnum, name="race", placeholder="Choisir une race")
    assert isinstance(component, rx.Component)


@pytest.mark.gui
def test_enum_radio_group_returns_reflex_component():
    component = enum_radio_group(SampleEnum, name="race")
    assert isinstance(component, rx.Component)
