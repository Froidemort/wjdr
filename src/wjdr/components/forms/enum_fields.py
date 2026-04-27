"""Factories for enum-based form widgets in Reflex."""

from enum import Enum
from typing import Callable, Optional

import reflex as rx


def _assert_string_enum(enum_cls: type[Enum]) -> None:
    """Ensure the enum uses string values (StrEnum or str, Enum)."""
    if not (issubclass(enum_cls, Enum) and issubclass(enum_cls, str)):
        raise TypeError("enum_cls must be a string-backed enum (StrEnum or str, Enum)")


def enum_values(enum_cls: type[Enum]) -> list[str]:
    """Return enum values as a list for Reflex form controls."""
    _assert_string_enum(enum_cls)
    return [str(member.value) for member in enum_cls]


def parse_enum_value(enum_cls: type[Enum], raw_value: Optional[str]) -> Optional[Enum]:
    """Convert submitted string value to enum member.

    Returns None for missing input and raises ValueError for invalid values.
    """
    _assert_string_enum(enum_cls)
    if raw_value is None or raw_value == "":
        return None
    return enum_cls(raw_value)


def enum_select(
    enum_cls: type[Enum],
    *,
    name: str,
    placeholder: Optional[str] = None,
    default_value: Optional[str] = None,
    required: bool = False,
    on_change: Optional[Callable] = None,
) -> rx.Component:
    """Create a default enum selector widget using ``rx.select``."""
    return rx.select(
        enum_values(enum_cls),
        name=name,
        placeholder=placeholder,
        default_value=default_value,
        required=required,
        on_change=on_change,
    )


def enum_radio_group(
    enum_cls: type[Enum],
    *,
    name: str,
    default_value: Optional[str] = None,
    required: bool = False,
    on_change: Optional[Callable] = None,
) -> rx.Component:
    """Create an enum-based radio group widget."""
    return rx.radio_group(
        enum_values(enum_cls),
        name=name,
        default_value=default_value,
        required=required,
        on_change=on_change,
    )
