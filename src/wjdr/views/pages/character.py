from __future__ import annotations

from typing import TYPE_CHECKING, Any, get_args

from nicegui import ui

from wjdr.models.factory import primary_attribute_random_factory, secondary_attribute_random_factory
from wjdr.models.models import AstralSign, PrimaryAttributes, SecondaryAttributes
from wjdr.models.rules.data_json import map_careers_files
from wjdr.views.theme import frame

if TYPE_CHECKING:
    from nicegui.events import ValueChangeEventArguments


def step_player_infos(stepper: ui.stepper, character_data: dict[str, Any]):
    with ui.step("Informations de campagne"):
        ui.markdown("## Remplissez les informations de la campagne dans le Vieux Monde.").classes("mt-2 text-primary text-italic")
        character_data["player_name"] = ui.input("Nom du Joueur", value="", placeholder="Votre nom").classes("w-full").tooltip("Entrez votre nom de joueur")
        with ui.stepper_navigation():
            ui.button("Suivant", on_click=lambda: stepper.next()).classes("primary")


def step_name_race_and_gender(stepper: ui.stepper, character_data: dict[str, Any]):
    with ui.step("Nom, Race et Genre"):
        ui.markdown("## Remplissez les informations de base de votre personnage.").classes("mt-2 text-primary text-italic")
        ui.label("NOTE: Le choix de la race est important car il influence les caractéristiques principales du personnage.").classes("text-warning text-sm italic mb-4")

        # Nom du personnage avec bouton de génération aléatoire
        with ui.row().classes("w-full items-center gap-2"):
            character_data["name"] = ui.input("Nom", value="", placeholder="Nom du personnage").classes("flex-grow").tooltip("Entrez le nom de votre personnage")
            ui.button(icon="casino").classes("").tooltip("Lancer un dé pour générer un nom aléatoire")

        # Genre avec icône à gauche
        ui.label("Genre").classes("text-sm font-semibold mt-4 mb-2")
        with ui.row().classes("items-center gap-4"):
            gender_icon = ui.icon("male", size="xl", color="primary")

            def on_gender_change(e: ValueChangeEventArguments):
                if e.value == "Masculin":
                    gender_icon.name = "male"
                else:
                    gender_icon.name = "female"

            character_data["gender"] = (
                ui.radio(
                    options=[
                        "Masculin",
                        "Féminin",
                    ],
                    value="Masculin",
                    on_change=on_gender_change,
                )
                .props("inline")
                .tooltip("Sélectionnez le genre de votre personnage")
            )

        # Race avec icône à gauche
        ui.label("Race").classes("text-sm font-semibold mt-4 mb-2")
        with ui.row().classes("items-center gap-4"):
            # Mapping des races vers les icônes
            race_icons = {
                "Humain": "img:/resources/images/human-helmet.svg",
                "Elfe": "img:/resources/images/elf-helmet.svg",
                "Nain": "img:/resources/images/dwarf-face.svg",
                "Halfling": "img:/resources/images/halfelin-slingshot.svg",
            }

            race_image = ui.avatar(race_icons["Humain"], rounded=True, color="primary", size="xl")

            def on_race_change(e: ValueChangeEventArguments):
                race_image.set_icon(race_icons.get(e.value, race_icons["Humain"]))

            character_data["race"] = (
                ui.radio(
                    options=["Humain", "Elfe", "Nain", "Halfling"],
                    value="Humain",
                    on_change=on_race_change,
                )
                .props("inline")
                .tooltip("Sélectionnez la race de votre personnage")
            )

        with ui.stepper_navigation():
            ui.button("Suivant", on_click=lambda: stepper.next()).classes("primary")
            ui.button("Précédent", on_click=lambda: stepper.previous()).classes("secondary ml-2")


def step_detailed_infos(stepper: ui.stepper, character_data: dict[str, Any]):
    with ui.step("Informations détaillées"):
        ui.markdown("## Remplissez la descriptions de votre personnage.").classes("mt-2 text-primary text-italic")
        ui.markdown("> Note : Ces informations sont optionnelles mais enrichissent le background de votre personnage.").classes("text-sm italic mb-4")
        character_data["age"] = ui.input("Âge", value="", placeholder="Âge du personnage").classes("w-full").tooltip("Entrez l'âge de votre personnage")
        character_data["height"] = ui.input("Taille (cm)", value="", placeholder="Taille en cm").classes("w-full").tooltip("Entrez la taille de votre personnage en centimètres")
        character_data["weight"] = ui.input("Poids (kg)", value="", placeholder="Poids en kg").classes("w-full").tooltip("Entrez le poids de votre personnage en kilogrammes")
        character_data["astral_sign"] = ui.select(list(get_args(AstralSign)), with_input=True, label="Signe Astral").classes("w-full").tooltip("Sélectionnez le signe astral de votre personnage")
        character_data["birth_place"] = ui.input("Lieu de Naissance", value="", placeholder="Lieu de naissance du personnage").classes("w-full").tooltip("Entrez le lieu de naissance de votre personnage")
        character_data["siblings"] = ui.number("Nombre de frère(s) et soeur(s)", value=0).classes("w-full").tooltip("Entrez le nombre de frères et sœurs de votre personnage")
        character_data["distinctive_signs"] = (
            ui.textarea("Signes Distinctifs", value="", placeholder="Décrivez les signes distinctifs de votre personnage séparés par une virgule").classes("w-full").tooltip("Entrez les signes distinctifs de votre personnage")
        )
        character_data["chaos_mutations"] = (
            ui.textarea("Mutations du Chaos", value="", placeholder="Décrivez les mutations du chaos de votre personnage séparées par une virgule").classes("w-full").tooltip("Entrez les mutations du chaos de votre personnage")
        )
        with ui.stepper_navigation():
            ui.button("Suivant", on_click=lambda: stepper.next()).classes("primary")
            ui.button("Précédent", on_click=lambda: stepper.previous()).classes("secondary ml-2")


def step_attributes(stepper: ui.stepper, character_data: dict[str, Any]):
    with ui.step("Caractéristiques Principales et Secondaires"):
        ui.markdown("Générez les caractéristiques principales et secondaires de votre personnage en cliquant sur les boutons ci-dessous.").classes("mt-2 text-primary text-italic")

        def generate_primary_attributes():
            race = character_data.get("race", {}).value
            # Generate primary attributes
            primary_attrs = primary_attribute_random_factory(race)
            # Store in character_data
            character_data["primary_attributes"] = primary_attrs
            # Update table
            primary_attributes_table.rows.clear()
            primary_attributes_table.add_rows([primary_attrs])
            primary_attributes_table.update()

        def generate_secondary_attributes():
            race = character_data.get("race", {}).value
            # Generate secondary attributes
            secondary_attrs = secondary_attribute_random_factory(race)
            # Store in character_data
            character_data["secondary_attributes"] = secondary_attrs
            # Update table
            secondary_attributes_table.rows.clear()
            secondary_attributes_table.add_rows([secondary_attrs])
            secondary_attributes_table.update()

        ui.button("Générer les caractéristiques principales", icon="casino", on_click=generate_primary_attributes).classes("primary mb-4")

        columns = [{"name": attribute, "label": field_info.serialization_alias, "align": "center", "field": attribute} for attribute, field_info in PrimaryAttributes.model_fields.items()]
        initial_primary = character_data.get("primary_attributes", [])
        primary_attributes_table = ui.table(columns=columns, rows=[initial_primary] if initial_primary else []).classes("w-full").props("bordered").classes("text-primary")

        ui.label("Caractéristiques Secondaires").classes("text-lg font-bold mt-4")

        ui.button("Générer les caractéristiques secondaires", icon="casino", on_click=generate_secondary_attributes).classes("primary mb-4")

        columns = [{"name": attribute, "label": field_info.serialization_alias, "align": "center", "field": attribute} for attribute, field_info in SecondaryAttributes.model_fields.items()] + [
            {"name": "destiny_points", "label": "Points de Destin", "align": "center", "field": "destiny_points"}
        ]
        initial_secondary = character_data.get("secondary_attributes", [])
        secondary_attributes_table = ui.table(columns=columns, rows=[initial_secondary] if initial_secondary else []).classes("w-full").props("bordered").classes("text-primary")

        with ui.stepper_navigation():
            ui.button("Suivant", on_click=lambda: stepper.next()).classes("primary")
            ui.button("Précédent", on_click=lambda: stepper.previous()).classes("secondary ml-2")


def step_career(stepper: ui.stepper, character_data: dict[str, Any]):
    with ui.step("Carrière"):
        ui.markdown("## Sélectionnez la carrière de votre personnage et générez les compétences et talents associés.").classes("mt-2 text-primary text-italic")
        ui.select(options=[career for career, _ in map_careers_files()], label="Carrière").classes("w-full").tooltip("Sélectionnez la carrière de votre personnage. Vous pourrez voir les détails associés.")
        # Implementation for career selection and related skills/talents would go here.
        with ui.stepper_navigation():
            ui.button("Suivant", on_click=lambda: stepper.next()).classes("primary")
            ui.button("Précédent", on_click=lambda: stepper.previous()).classes("secondary ml-2")


def character_view():
    character_data = {}
    ui.button("Home", icon="home").on("click", lambda: ui.navigate.to("/")).classes("primary")
    ui.markdown("# Fiche de Personnage").classes("text-primary font-bold mt-4")
    ui.markdown("Bienvenue dans la création de votre personnage pour le jeu de rôle Warhammer. Remplissez les différentes sections pour construire votre héros ou héroïne.")
    ui.separator().classes("mb-4")
    # Here we create a form that represents a character sheet
    # Every field are represented with a NiceGUI input component
    # Some fields are inputs, other are read-only because computed
    # With pydantic, we create the Character model from a dictionary
    with ui.stepper() as stepper:
        step_player_infos(stepper, character_data)
        step_name_race_and_gender(stepper, character_data)
        step_detailed_infos(stepper, character_data)
        step_attributes(stepper, character_data)
        step_career(stepper, character_data)

    def save_character_sheet():
        # Here you would implement the logic to save the character sheet
        ui.notify("Fiche de personnage enregistrée avec succès!", color="positive")

    ui.button("Enregistrer la Fiche", icon="save", on_click=save_character_sheet).classes("primary mt-4").tooltip("Cliquez pour enregistrer votre fiche de personnage")


def character_page() -> None:
    with frame("Fiche de Personnage", no_footer=True, no_header=True):
        character_view()
