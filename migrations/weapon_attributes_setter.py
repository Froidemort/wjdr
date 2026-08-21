import json
import logging
import os
import sys

import dotenv
import questionary
import tabulate
from postgrest import SyncQueryRequestBuilder
from postgrest.exceptions import APIError
from postgrest.types import JSON
from supabase import Client, PostgrestAPIResponse, create_client

LOGGER = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.WARNING, format="%(asctime)s - %(levelname)s - %(message)s"
)
LOGGER.setLevel(logging.DEBUG)

dotenv.load_dotenv(dotenv.find_dotenv())

url: str = os.getenv("VITE_SUPABASE_URL", "")
key: str = os.getenv("SUPABASE_KEY", "")

supabase: Client = create_client(url, key)


def wrap_query(query: SyncQueryRequestBuilder) -> list[JSON]:
    """Wraps a Supabase query and returns the data as a list of dictionaries."""
    try:
        response = query.execute()
    except APIError as e:
        LOGGER.error(f"APIError[{e.code}]: {e.message} - {e.hint}")
        response = PostgrestAPIResponse(data=[], count=0)
    return response.data


def get_weapons(client: Client) -> list[JSON]:
    try:
        response = wrap_query(client.table("weapons").select("*"))
        return response
    except APIError as e:
        LOGGER.error(f"Error fetching weapons: {e}")
        raise


def get_weapon_attributes(client: Client) -> list[JSON]:
    try:
        response = wrap_query(client.table("weapon_attributes").select("*"))
        return response
    except APIError as e:
        LOGGER.error(f"Error fetching weapon attributes : {e}")
        raise


def populate_database(
    client: Client,
    selected_attributes: dict[str, list[str]],
    is_melee: dict[str, bool],
    weapon_id_map: dict[str, int],
    attribute_id_map: dict[str, int],
) -> None:
    questionary.print(
        "Updating weapon attributes in the database...", style="bold fg:yellow"
    )
    try:
        for weapon, attributes in selected_attributes.items():
            questionary.print(
                f"Updating weapon '{weapon}' with attributes {attributes} and melee status {'yes' if is_melee[weapon] else 'no'}",
                style="bold fg:blue",
            )
            weapon_id = weapon_id_map[weapon]
            attribute_ids = [attribute_id_map[attr] for attr in attributes]
            is_melee_value = is_melee[weapon]
            # Update the weapon's attributes and melee status in the database
            client.table("weapons").update({"is_melee": is_melee_value}).eq(
                "id", weapon_id
            ).execute()
            data_attributes = [
                {"weapon_id": weapon_id, "attribute_id": attr_id}
                for attr_id in attribute_ids
            ]
            LOGGER.debug(f"Inserting weapon attribute mappings: {data_attributes}")
            if data_attributes:
                client.table("weapon_attribute_mappings").insert(
                    data_attributes, upsert=True
                ).execute()
        questionary.print(
            "Weapon attributes updated successfully!", style="bold fg:green"
        )
    except APIError as e:
        LOGGER.error(f"Error updating weapon attributes: {e}")
        questionary.print(f"Error updating weapon attributes: {e}", style="bold fg:red")


if __name__ == "__main__":
    from argparse import ArgumentParser
    from pathlib import Path

    parser = ArgumentParser(description="Set weapon attributes in the database.")
    parser.add_argument(
        "json_file",
        help="Path to the JSON file containing weapon attributes.",
        type=str,
    )
    weapons = get_weapons(supabase)
    weapon_attributes = get_weapon_attributes(supabase)
    weapons_names = [weapon["name"] for weapon in weapons]
    weapon_attributes_names = [attr["name"] for attr in weapon_attributes]
    # helpers
    weapon_id_map = {weapon["name"]: weapon["id"] for weapon in weapons}
    attribute_id_map = {attr["name"]: attr["id"] for attr in weapon_attributes}
    # data
    selected_attributes = {}
    is_melee = {}

    args = parser.parse_args()
    json_file_path = Path(args.json_file)
    if json_file_path.exists():
        with open(json_file_path, "r") as f:
            data = json.load(f)
            for element in data:
                weapon = element["weapon"]
                selected_attributes[weapon] = element["selected_attributes"]
                is_melee[weapon] = element["is_melee"]
            populate_database(
                supabase, selected_attributes, is_melee, weapon_id_map, attribute_id_map
            )
        sys.exit(0)

    # if no JSON or json does not exists.
    for weapon_name in weapons_names:
        selected_attributes[weapon_name] = questionary.checkbox(
            f"Select attributes for weapon '{weapon_name}':",
            choices=weapon_attributes_names,
        ).ask()
        questionary.print(
            f"Selected attributes for weapon '{weapon_name}': {selected_attributes}",
            style="bold fg:green",
        )
        is_melee[weapon_name] = questionary.confirm(
            f"Is the weapon {weapon_name} a melee weapon?"
        ).ask()
        questionary.print(
            f"Weapon '{weapon_name}' is melee: {'yes' if is_melee[weapon_name] else 'no'}",
            style="bold fg:blue",
        )

    # Summary :
    questionary.print(
        "\nSummary of selected attributes and melee status:", style="bold fg:cyan"
    )
    questionary.print(
        "Please check the summary below and confirm if everything is correct. If you want to modify any weapon's attributes or melee status, you will have the opportunity to do so.",
        style="bold fg:cyan",
    )
    questionary.print(
        tabulate.tabulate(
            [
                (
                    weapon,
                    ", ".join(selected_attributes[weapon]),
                    "Yes" if is_melee[weapon] else "No",
                )
                for weapon in selected_attributes
            ],
            headers=["Weapon", "Selected Attributes", "Is Melee"],
            tablefmt="fancy_grid",
        ),
        style="bold fg:cyan",
    )
    # We ask if everything is ok :
    everything_ok = questionary.confirm("Is everything correct?").ask()
    display_final_summary = False
    while not everything_ok:
        display_final_summary = True
        weapon_to_modify = questionary.autocomplete(
            "Select the weapon to modify:",
            choices=weapons_names,
        ).ask()
        choice = questionary.select(
            f"What do you want to modify for weapon '{weapon_to_modify}'?",
            choices=["Selected Attributes", "Melee/Ranged Status", "Both"],
        ).ask()
        if choice == "Selected Attributes":
            selected_attributes[weapon_to_modify] = questionary.checkbox(
                f"Select attributes for weapon '{weapon_to_modify}':",
                choices=weapon_attributes_names,
            ).ask()
            questionary.print(
                f"Updated selected attributes for weapon '{weapon_to_modify}': {selected_attributes[weapon_to_modify]}",
                style="bold fg:green",
            )
        elif choice == "Melee/Ranged Status":
            is_melee[weapon_to_modify] = questionary.confirm(
                f"Is the weapon {weapon_to_modify} a melee weapon?"
            ).ask()
            questionary.print(
                f"Updated melee status for weapon '{weapon_to_modify}': {'yes' if is_melee[weapon_to_modify] else 'no'}",
                style="bold fg:blue",
            )
        elif choice == "Both":
            selected_attributes[weapon_to_modify] = questionary.checkbox(
                f"Select attributes for weapon '{weapon_to_modify}':",
                choices=weapon_attributes_names,
            ).ask()
            questionary.print(
                f"Updated selected attributes for weapon '{weapon_to_modify}': {selected_attributes[weapon_to_modify]}",
                style="bold fg:green",
            )
            is_melee[weapon_to_modify] = questionary.confirm(
                f"Is the weapon {weapon_to_modify} a melee weapon?"
            ).ask()
            questionary.print(
                f"Updated melee status for weapon '{weapon_to_modify}': {'yes' if is_melee[weapon_to_modify] else 'no'}",
                style="bold fg:blue",
            )
        everything_ok = questionary.confirm(
            "Is everything correct now, or do you want to modify another weapon ?",
            default=True,
        ).ask()
    if (
        display_final_summary
    ):  # We display the final summary only if the user modified something
        # Final table :
        questionary.print(
            "\nFinal summary of selected attributes and melee status after modifications:",
            style="bold fg:cyan",
        )
        questionary.print(
            tabulate.tabulate(
                [
                    (
                        weapon,
                        ", ".join(selected_attributes[weapon]),
                        "Yes" if is_melee[weapon] else "No",
                    )
                    for weapon in selected_attributes
                ],
                headers=["Weapon", "Selected Attributes", "Is Melee"],
                tablefmt="fancy_grid",
            ),
            style="bold fg:cyan",
        )
    # save json :
    final_data = {
        weapon: {
            "attributes": selected_attributes[weapon],
            "is_melee": is_melee[weapon],
        }
        for weapon in selected_attributes
    }
    with open("weapon_attributes.json", "w") as f:
        json.dump(final_data, f, indent=4)
