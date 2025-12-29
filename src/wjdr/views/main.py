from __future__ import annotations

import os
from pathlib import Path

from nicegui import app, ui

from wjdr.views.pages.campain_creation import campain_page
from wjdr.views.pages.character_creation import character_page
from wjdr.views.theme import frame


@ui.page("/character-creation")
def character_creation() -> None:
    """Character creation page."""
    character_page()


@ui.page("/campain-creation")
def campain_creation() -> None:
    """Campaign creation page."""
    campain_page()


def index() -> None:
    with ui.row().classes("items-center justify-center gap-4"):
        ui.link("Créer une fiche de personnage", "/character-creation").classes("text-lg font-bold text-primary mt-6")
        ui.link("Créer une campagne", "/campain-creation").classes("text-lg font-bold text-primary mt-6")


@ui.page("/")
def root() -> None:
    with frame("WJDR"):
        index()


def main() -> None:
    # Configure static files for resources (images, etc.)
    resources_path = Path(__file__).parent.parent.parent.parent / "resources"
    app.add_static_files("/resources", resources_path)

    port = int(os.getenv("PORT", "8080"))
    ui.run(title="WJDR", reload=True, port=port, dark=True, uvicorn_reload_dirs="src/wjdr/views/")


if __name__ in {"__main__", "__mp_main__"}:
    main()
