from __future__ import annotations

import datetime
from typing import Any

from nicegui import ui

from wjdr.models.models import Campaign
from wjdr.views.pages.helpers import store_state
from wjdr.views.theme import frame


def general_info_step(stepper: ui.stepper, state: dict[str, Any]) -> None:
    """General info step for campain creation."""
    ui.markdown("## Informations Générales").classes("text-primary font-bold mt-4")
    state["name"] = ui.input(label="Nom de la campagne", placeholder="Entrez le nom de la campagne", value="").classes("w-full")
    state["description"] = ui.textarea(label="Description de la campagne", placeholder="Entrez la description de la campagne", value="").classes("w-full")
    state["game_master_name"] = ui.input(label="Maître du jeu", placeholder="Entrez le nom du maître du jeu", value="").classes("w-full")
    state["start_date"] = ui.date("Date de début").classes("center")
    with ui.stepper_navigation():
        ui.button("Suivant").on("click", stepper.next)


def scenario_step(stepper: ui.stepper, state: dict[str, Any]) -> None:
    """Scenario step (optional).
    Here, you can choose an existing scenario or create a new one.
    """
    print(state)
    ui.markdown("## Scénario").classes("text-primary font-bold mt-4")
    ui.markdown("Choisissez un scénario existant ou créez-en un nouveau.").classes("text-primary text-italic")
    radio_options = ["Utiliser un scénario existant", "Créer un nouveau scénario"]
    ui.radio(options=radio_options, value=radio_options[0]).classes("w-full")
    ui.upload(label="Importer un scénario").classes("w-full")
    with ui.card().classes("p-4 mt-4 w-full"):
        ui.markdown("### Création de nouveau scénario").classes("text-primary font-bold mt-2")
        ui.input(label="Titre du scénario", placeholder="Entrez le titre du scénario", value="").classes("w-full")
        ui.textarea(label="Description du scénario", placeholder="Entrez la description du scénario", value="").classes("w-full")
    with ui.stepper_navigation():
        ui.button("Précédent").on("click", stepper.previous)
        ui.button("Suivant").on("click", stepper.next)


def characters_step(stepper: ui.stepper, state: dict[str, Any]) -> None:
    """Characters step for campain creation."""
    ui.markdown("## Personnages").classes("text-primary font-bold mt-4")
    ui.markdown("Ajoutez les personnages participants à la campagne.").classes("text-primary text-italic")
    ui.label("Ajout de personnages à implémenter.")
    with ui.stepper_navigation():
        ui.button("Précédent").on("click", stepper.previous)
        ui.button("Terminer").on("click", lambda: store_state(Campaign, state))


def campain_creator():
    """Create the campain form."""
    state: dict[str, Any] = {
        "name": "",
        "game_master_name": None,
        "description": None,
        "start_date": datetime.date.today(),
        "end_date": None,
        "scenario": None,  # Scenario | None
        "characters": [],  # list[Character]
    }
    ui.markdown("# Création de Campagne").classes("text-primary font-bold mt-4")
    ui.markdown("Créez ici votre campagne pour Warhammer le jeux de rôle.").classes("text-primary text-italic")
    ui.separator().classes("mb-4")
    with ui.stepper().props("vertical").classes("w-full") as stepper:
        with ui.step("Informations Générales"):
            general_info_step(stepper, state)
        with ui.step("Scénario"):
            scenario_step(stepper, state)
        with ui.step("Personnages"):
            characters_step(stepper, state)


def campain_page() -> None:
    with frame("Création de Campagne", no_footer=True, no_header=True):
        campain_creator()
