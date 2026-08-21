import logging
import os
from pathlib import Path

import dotenv
import pdfplumber
import questionary
from postgrest import APIError, SyncQueryRequestBuilder
from postgrest.types import JSON
from supabase import Client, PostgrestAPIResponse, create_client
from unidecode import unidecode

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


def sanitize_string_from_pdf(pdf_string: str):
    # Can be used to sanitize the string from the PDF, for example to remove accents, replace special characters, etc.
    pdf_string = pdf_string.replace("’", "'").replace("-", " ").replace("\n", " ")
    # Particular cases...
    if (
        "Connaissan." in pdf_string
        or pdf_string.strip(" ") == "Connaissance des pièges"
    ):
        pdf_string = "Connaissances des pièges"
    if pdf_string == "Intriguant":
        pdf_string = "Intrigant"
    if pdf_string == "Talent artistique":
        pdf_string = "Talents artistique"
    # return without accents
    return unidecode(pdf_string)


def sanitize_talents(str_talents: str):
    talents = []
    for line in str_talents.split("\n"):
        if ":" not in line:
            continue
        talents.append(sanitize_string_from_pdf(line.split(":")[0].strip(" ")))
    return talents


# The main difficulty here is to get the information of the skills and talents that are linked to each other.
def get_skills_talents_links() -> list[dict]:
    """Get the skills and the linked talent from the PDF"""
    skills_talents_links: list[dict] = []
    with pdfplumber.open(
        Path(__file__).parent / "compendium_skills_talents.pdf"
    ) as pdf:
        for page in pdf.pages:
            # Here we check if there is a table
            tables = page.extract_tables()
            if not tables or len(tables) == 0:
                continue
            table = tables[0]
            for row in table:
                if len(row) < 4 or "Compétences" in row[0]:
                    continue  # talent or header row
                skill = sanitize_string_from_pdf(row[0])
                talents = sanitize_talents(row[3])
                skills_talents_links.append({"skill": skill, "talents": talents})
    return skills_talents_links


def associate(
    client: Client,
    json_path: Path = Path(__file__).parent.parent
    / "skills_talents_links_dry_run.json",
) -> None:
    skills = wrap_query(client.table("skills").select("*"))
    map_skill_name_to_id = {
        (skill["name"], skill["specialization"]): skill["id"] for skill in skills
    }
    talents = wrap_query(client.table("talents").select("*"))
    map_talent_name_to_id = {
        (talent["name"], talent["specialization"]): talent["id"] for talent in talents
    }
    links = get_skills_talents_links()
    talents_skills_to_confirm = {}
    data_to_insert = []
    for skill in skills:
        normalized_skill = unidecode(skill["name"])
        for link in links:
            if normalized_skill == link["skill"]:
                for talent in link["talents"]:
                    normalized_talent = unidecode(talent)
                    # Ici on essaye de matcher le talent avec la table des talents
                    for talent_row in talents:
                        if normalized_talent == unidecode(talent_row["name"]):
                            # Dans ce cas, on a 3 cas de figure :
                            # - La compétence a une spécialisation non vide. Dans de cas, on cherche si par hasard on ne retrouve pas cette spécialisation dans la description du talent
                            # - La compétence n'a pas de spécialisation. Dans ce cas, on peut directement lier la compétence et le talent
                            # - La compétence a une spécialisation, et cette spécialisation n'est pas dans la description du talent. Dans ce cas, on demande confirmation ou on le trace.
                            # Dans le cas de la confirmation, on stocke un dictionnaire avec clé:talent_name et valeur:skill_name. On demande alors dans un second temps si on veur lier les compétences aux talents listés.
                            if skill["specialization"]:
                                if (
                                    skill["specialization"].lower()
                                    in unidecode(talent_row["description"]).lower()
                                ):
                                    # On peut lier la compétence et le talent
                                    LOGGER.info(
                                        f"Linking skill {skill['name']} with specialization {skill['specialization']} to talent {talent_row['name']}"
                                    )
                                    # client.table("skills_talents_links").insert({
                                    #     "skill_id": skill["id"],
                                    #     "talent_id": talent_row["id"]
                                    # }).execute()
                                    data_to_insert.append(
                                        {
                                            "skill_id": skill["id"],
                                            "talent_id": talent_row["id"],
                                        }
                                    )
                                else:
                                    LOGGER.warning(
                                        f"Skill {skill['name']} with specialization {skill['specialization']} does not match talent {talent_row['name']}"
                                    )
                                    talents_skills_to_confirm.setdefault(
                                        (
                                            talent_row["name"],
                                            talent_row["specialization"],
                                        ),
                                        [],
                                    ).extend([(skill["name"], skill["specialization"])])
                            else:
                                # La compétence n'a pas de spécialisation. On peut lier directement la compétence et le talent
                                LOGGER.info(
                                    f"Linking skill {skill['name']} to talent {talent_row['name']}"
                                )
                                # client.table("skills_talents_links").insert({
                                #     "skill_id": skill["id"],
                                #     "talent_id": talent_row["id"]
                                # }).execute()
                                data_to_insert.append(
                                    {
                                        "skill_id": skill["id"],
                                        "talent_id": talent_row["id"],
                                    }
                                )
                            # Maintenant on demande confirmation pour les talents_skills_to_confirm
    if talents_skills_to_confirm:
        for talent_name, talent_specialization in talents_skills_to_confirm:
            answer = questionary.checkbox(
                f"Talent '{talent_name}' with specialization '{talent_specialization}' has multiple matching skills. Please select the skills to link:",
                choices=[
                    questionary.Choice(
                        title=f"{skill_name} ({skill_specialization})",
                        value=(skill_name, skill_specialization),
                    )
                    for skill_name, skill_specialization in talents_skills_to_confirm[
                        (talent_name, talent_specialization)
                    ]
                ],
            ).ask()
            if answer:
                LOGGER.info(
                    f"Linking talent '{talent_name}' with specialization '{talent_specialization}' to selected skills: {answer}"
                )
                for skill_name, skill_specialization in answer:
                    skill_id = map_skill_name_to_id.get(
                        (skill_name, skill_specialization)
                    )
                    talent_id = map_talent_name_to_id.get(
                        (talent_name, talent_specialization)
                    )
                    if skill_id and talent_id:
                        data_to_insert.append(
                            {"skill_id": skill_id, "talent_id": talent_id}
                        )
    if questionary.confirm(
        "Do you want to perform a dry run (no changes will be made)?"
    ).ask():
        questionary.print(
            "Dry run selected. No changes will be made to the database.",
            style="bold fg:yellow",
        )
        import json

        json_path.write_text(
            json.dumps(data_to_insert, indent=4, ensure_ascii=False)
        )
        return
    try:
        if data_to_insert:
            client.table("skills_talents_links").insert(
                data_to_insert, upsert=True
            ).execute()
        questionary.print(
            "Skills and talents links updated successfully!", style="bold fg:green"
        )
    except APIError as e:
        LOGGER.error(f"Error updating skills and talents links: {e}")
        questionary.print(
            f"Error updating skills and talents links: {e}", style="bold fg:red"
        )


if __name__ == "__main__":
    json_path = Path(__file__).parent.parent / "skills_talents_links_dry_run.json"
    if not json_path.exists():
        associate(supabase, json_path)
    else:
        answer = questionary.confirm(
            f"Dry run file '{json_path}' exists. Do you want to apply the changes to the database?"
        ).ask()
        if answer:
            import json

            data_to_insert = json.loads(json_path.read_text())
            try:
                if data_to_insert:
                    supabase.table("skills_talents").insert(
                        data_to_insert, upsert=True
                    ).execute()
                questionary.print(
                    "Skills and talents links updated successfully!",
                    style="bold fg:green",
                )
            except APIError as e:
                LOGGER.error(f"Error updating skills and talents links: {e}")
                questionary.print(
                    f"Error updating skills and talents links: {e}", style="bold fg:red"
                )
        else:
            questionary.print(
                "Operation cancelled. No changes were made.", style="bold fg:yellow"
            )
