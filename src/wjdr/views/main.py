from __future__ import annotations

import os
from pathlib import Path

from nicegui import app, ui

from wjdr.views.pages.character_creation import character_page
from wjdr.views.theme import frame


@ui.page("/character-creation")
def character_creation() -> None:
    """Character creation page."""
    character_page()


def index() -> None:
    with ui.row().classes("items-center justify-center gap-4"):
        ui.link("Créer une fiche de personnage", "/character").classes("text-lg font-bold text-primary mt-6")
    # ui.markdown('# Welcome to WJDR').classes('text-primary font-bold')
    # ui.markdown('This is the main page of the WJDR application.').classes('text-info')
    # ui.markdown('This place is very dark, be careful!)').classes('text-warning')
    # ui.markdown('If you need help, contact support.').classes('text-positive')
    # ui.markdown('If something goes wrong, please report a bug.').classes('text-negative')
    # ui.markdown('Enjoy your stay!').classes('text-accent')
    # ui.markdown('The theme colors are inspired by classic RPG aesthetics.').classes('text-secondary')
    # ui.markdown('Explore the features and have fun!').classes('text-primary')
    # ui.markdown('This sentence is in accent color.').classes('text-accent')


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
