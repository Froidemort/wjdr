from __future__ import annotations
from typing import TYPE_CHECKING, get_args
from nicegui import ui

from wjdr.models.models import AstralSign, PrimaryAttributes, SecondaryAttributes, primary_attribute_random_factory, secondary_attribute_random_factory
from wjdr.views.theme import frame

if TYPE_CHECKING:
    from nicegui.events import ValueChangeEventArguments

def character_view():
    character_data = {}
    with ui.row():
        ui.button("Home", icon='home').on('click', lambda: ui.navigate.to('/')).classes('primary')
    ui.markdown('# Fiche de Personnage').classes('text-primary font-bold')
    # Here we create a form that represents a character sheet
    # Every field are represented with a NiceGUI input component
    # Some fields are inputs, other are read-only because computed
    # With pydantic, we create the Character model from a dictionary
    with ui.expansion("Informations de campagne", icon='3p'):
        character_data["player_name"] = ui.input('Nom du Joueur', value='', placeholder="Votre nom").classes('w-full').tooltip('Entrez votre nom de joueur')
        character_data["master_name"] = ui.input('Nom du Maître de Jeu', value='', placeholder="Nom du MJ").classes('w-full').tooltip('Entrez le nom de votre maître de jeu')
        character_data["campaign_name"] = ui.input('Nom de la Campagne', value='', placeholder="Nom de la campagne").classes('w-full').tooltip('Entrez le nom de la campagne')
    ui.separator().classes('my-4')

    character_data["name"] = ui.input('Nom', value='', placeholder="Nom du personnage").classes('w-full').tooltip('Entrez le nom de votre personnage')
    ui.button(icon='casino').classes('ml-2').tooltip('Lancer un dé pour générer un nom aléatoire')
    gender_icon = ui.icon('male', size="xl", color='primary').classes('mr-2')
    def on_gender_change(e: ValueChangeEventArguments):
        if e.value == 'Masculin':
            gender_icon.name = 'male'
        else:
            gender_icon.name = 'female'
    character_data["gender"] = ui.radio(options=['Masculin', 'Féminin',],
                        value='Masculin', on_change=on_gender_change).classes('w-full').props('inline').tooltip('Sélectionnez le genre de votre personnage')
    character_data["race"] = ui.radio(options=['Humain', 'Elfe', 'Nain', 'Halfling'], value='Humain').classes('w-full').props('inline').tooltip('Sélectionnez la race de votre personnage')
    ui.separator()
    with ui.expansion('Informations détaillées', icon='info').classes('w-full'):
        character_data["age"] = ui.input('Âge', value='', placeholder="Âge du personnage").classes('w-full').tooltip('Entrez l\'âge de votre personnage')
        character_data["height"] = ui.input('Taille (cm)', value='', placeholder="Taille en cm").classes('w-full').tooltip('Entrez la taille de votre personnage en centimètres')
        character_data["weight"] = ui.input('Poids (kg)', value='', placeholder="Poids en kg").classes('w-full').tooltip('Entrez le poids de votre personnage en kilogrammes')
        character_data["astral_sign"] = ui.select(list(get_args(AstralSign)), with_input=True, label='Signe Astral').classes('w-full').tooltip('Sélectionnez le signe astral de votre personnage')
        character_data["birth_place"] = ui.input('Lieu de Naissance', value='', placeholder="Lieu de naissance du personnage").classes('w-full').tooltip('Entrez le lieu de naissance de votre personnage')
        character_data["siblings"] = ui.number('Nombre de frère(s) et soeur(s)', value=0).classes('w-full').tooltip('Entrez le nombre de frères et sœurs de votre personnage')
        character_data["distinctive_signs"] = ui.textarea('Signes Distinctifs', value='', placeholder="Décrivez les signes distinctifs de votre personnage séparés par une virgule").classes('w-full').tooltip('Entrez les signes distinctifs de votre personnage')
        character_data["chaos_mutations"] = ui.textarea('Mutations du Chaos', value='', placeholder="Décrivez les mutations du chaos de votre personnage séparées par une virgule").classes('w-full').tooltip('Entrez les mutations du chaos de votre personnage')
    ui.separator().classes('my-4')
    with ui.expansion('Caractéristique Principale', icon='fitness_center').classes('w-full'):
        columns = [{'name': attribute, 'label': field_info.serialization_alias, 'align': 'center', 'field': attribute} for attribute, field_info in PrimaryAttributes.model_fields.items()]
        rows =[{name: value['base'] for name, value in primary_attribute_random_factory(character_data["race"].value).model_dump().items()}]
        table = ui.table(columns=columns, rows=rows).classes('w-full').props('bordered').classes('text-primary')
    ui.separator().classes('my-4')
    with ui.expansion('Caractéristique Secondaire', icon='fitness_center').classes('w-full'):
        columns = [{'name': attribute, 'label': field_info.serialization_alias, 'align': 'center', 'field': attribute} for attribute, field_info in SecondaryAttributes.model_fields.items()]
        rows = rows =[{name: value['base'] for name, value in secondary_attribute_random_factory(character_data["race"].value).model_dump().items()}]
        table = ui.table(columns=columns, rows=rows).classes('w-full').props('bordered').classes('text-primary')
    def save_character_sheet():
        # Here you would implement the logic to save the character sheet
        ui.notify('Fiche de personnage enregistrée avec succès!', color='positive')
    ui.button('Enregistrer la Fiche', icon='save', on_click=save_character_sheet).classes('primary mt-4').tooltip('Cliquez pour enregistrer votre fiche de personnage')


def character_page() -> None:
    with frame('Fiche de Personnage', no_footer=True, no_header=True):
        character_view()