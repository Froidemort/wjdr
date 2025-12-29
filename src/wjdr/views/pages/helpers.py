from __future__ import annotations

from typing import Any

from nicegui import ui
from pydantic import ValidationError

from wjdr.models.models import Campaign, Character, Scenario

StorableModel = Campaign | Character | Scenario


def store_state(model: type[StorableModel], state: dict[str, Any]) -> None:
    """Store Campain data and finish creation."""
    try:
        campain = model(**{k: v.value if hasattr(v, "value") else v for k, v in state.items()})
        print("Campain created:", campain)
        ui.navigate.to("/")
    except ValidationError:
        ui.notify("Erreur lors de la création de la campagne, vérifiez les données", color="negative")
