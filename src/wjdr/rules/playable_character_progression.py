"""Application-level helpers for playable character progression rules."""

import uuid

from sqlalchemy.orm import Session as OrmSession
from sqlmodel import select

from wjdr.models import (
    CareerTable,
    PlayableCharacterCareerLinkTable,
    PlayableCharacterTable,
    PrimaryAttributeEnum,
    SecondaryAttributeEnum,
)

ATTRIBUTE_CAP_FIELDS = tuple(attribute.value for attribute in PrimaryAttributeEnum) + tuple(attribute.value for attribute in SecondaryAttributeEnum)


def _compute_current_career_attributes_cap(current_career: CareerTable | None) -> dict[str, int]:
    """Compute attribute cap bonus from the current career only."""
    cap = {attribute_name: 0 for attribute_name in ATTRIBUTE_CAP_FIELDS}
    if current_career is None or current_career.attributes is None:
        return cap

    for attribute_name in ATTRIBUTE_CAP_FIELDS:
        cap[attribute_name] += getattr(current_career.attributes, attribute_name)
    return cap


def validate_playable_character_total_attributes(character: PlayableCharacterTable, current_career: CareerTable | None = None) -> None:
    """Ensure total attributes stay between base and base + current career cap."""
    if character.base_attributes is None or character.total_attributes is None:
        return

    effective_current_career = current_career
    if effective_current_career is None and len(character.career) == 1:
        effective_current_career = character.career[0]

    career_cap = _compute_current_career_attributes_cap(effective_current_career)

    below_base_errors: list[str] = []
    above_cap_errors: list[str] = []
    for attribute_name in ATTRIBUTE_CAP_FIELDS:
        base_value = getattr(character.base_attributes, attribute_name)
        total_value = getattr(character.total_attributes, attribute_name)
        max_allowed_value = base_value + career_cap[attribute_name]

        if total_value < base_value:
            below_base_errors.append(f"{attribute_name}={total_value} < base={base_value}")
        if total_value > max_allowed_value:
            above_cap_errors.append(f"{attribute_name}={total_value} > max={max_allowed_value}")

    if below_base_errors or above_cap_errors:
        details = []
        if below_base_errors:
            details.append("below base: " + ", ".join(below_base_errors))
        if above_cap_errors:
            details.append("above cap: " + ", ".join(above_cap_errors))
        raise ValueError("Invalid playable character total attributes (" + " | ".join(details) + ")")


def get_current_career_for_character(session: OrmSession, character_id: uuid.UUID) -> CareerTable | None:
    """Return the current career (highest order) for a character in the current transaction state."""
    career_orders = {
        career_id: career_order
        for career_id, career_order in session.exec(
            select(PlayableCharacterCareerLinkTable.career_id, PlayableCharacterCareerLinkTable.order).where(
                PlayableCharacterCareerLinkTable.playable_character_id == character_id
            )
        ).all()
    }

    for instance in session.new:
        if isinstance(instance, PlayableCharacterCareerLinkTable) and instance.playable_character_id == character_id:
            career_orders[instance.career_id] = instance.order

    for instance in session.deleted:
        if isinstance(instance, PlayableCharacterCareerLinkTable) and instance.playable_character_id == character_id:
            career_orders.pop(instance.career_id, None)

    for instance in session.dirty:
        if isinstance(instance, PlayableCharacterCareerLinkTable) and instance.playable_character_id == character_id:
            career_orders[instance.career_id] = instance.order

    if not career_orders:
        return None

    current_career_id = max(
        career_orders.items(),
        key=lambda item: (item[1], str(item[0])),
    )[0]
    return session.get(CareerTable, current_career_id)


def get_next_playable_character_career_order(session: OrmSession, character_id: uuid.UUID) -> int:
    """Return the next order value for a new playable character career link."""
    current_max_order = session.exec(
        select(PlayableCharacterCareerLinkTable.order)
        .where(PlayableCharacterCareerLinkTable.playable_character_id == character_id)
        .order_by(PlayableCharacterCareerLinkTable.order.desc())
    ).first()
    if current_max_order is None:
        return 0
    return current_max_order + 1


def build_playable_character_career_link_with_next_order(session: OrmSession, character_id: uuid.UUID, career_id: uuid.UUID) -> PlayableCharacterCareerLinkTable:
    """Create a career link with auto-incremented order for the given character."""
    return PlayableCharacterCareerLinkTable(
        playable_character_id=character_id,
        career_id=career_id,
        order=get_next_playable_character_career_order(session, character_id),
    )
