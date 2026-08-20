import json
import logging
import os
import pathlib

import dotenv
import pdfplumber
from postgrest import SyncQueryRequestBuilder
from postgrest.exceptions import APIError
from postgrest.types import JSON
from supabase import Client, PostgrestAPIResponse, create_client
from tabulate import tabulate
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

# Chemin vers le fichier PDF
base_path = pathlib.Path(__file__).parent.resolve()
pdf_path = base_path / "compendium_carrieres_modifie.pdf"
output_json_path = base_path / "career_data.json"
output_failed_careers_path = base_path / "failed_careers.json"

CHARACTERISTIC_LABELS = [
    "CC",
    "CT",
    "F",
    "E",
    "Ag",
    "Int",
    "FM",
    "Soc",
    "A",
    "B",
    "M",
    "Mag",
]


def sanitize_text(text):
    return unidecode(text.strip().replace(" (A)", "").replace(" (B)", "").lower())


def sanitize_characteristics(characteristics):
    """Sanitize a list of characteristics by converting them to integers, replacing empty strings with 0."""
    return [int(c) if c else 0 for c in characteristics]


def wrap_query(query: SyncQueryRequestBuilder) -> list[JSON]:
    """Wraps a Supabase query and returns the data as a list of dictionaries."""
    try:
        response = query.execute()
    except APIError as e:
        LOGGER.error(f"APIError[{e.code}]: {e.message} - {e.hint}")
        response = PostgrestAPIResponse(data=[], count=0)

    return response.data


def check_pdf_structure(pdf_file):
    """Checks the structure of the PDF and prints out rows containing 'Accès' or 'Débouchés'."""
    with pdfplumber.open(pdf_file) as pdf:
        for page_index, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    row_text = " ".join([str(cell) for cell in row if cell])
                    if "Débouchés" in row_text or "Accès" in row_text:
                        LOGGER.debug(f"Page {page_index + 1}: {row_text}")


def get_careers(client: Client) -> list[JSON]:
    """Fetches the list of careers from the Supabase database."""
    careers = wrap_query(client.table("careers").select("id, name"))
    return careers


careers = get_careers(supabase)
if LOGGER.level <= logging.DEBUG:
    with open("careers.json", "w", encoding="utf-8") as fin:
        json.dump(careers, fin, indent=4)


def get_id_from_name(careers: list[JSON], name: str) -> str | None:
    """Returns the ID of a career given its name, ou None si non trouvé."""
    for career in careers:
        if not isinstance(career, dict) or "id" not in career or "name" not in career:
            continue
        if career["name"] == name:
            return career["id"]  # type: ignore
    return None


def extract_career_data(pdf_file):
    careers_data = {}
    pages = None
    failed_careers = []
    with pdfplumber.open(pdf_file) as pdf:
        pages = pdf.pages
        for page_index, page in enumerate(pages):
            tables = page.extract_tables()
            if not tables or len(tables) == 0:
                continue
            LOGGER.debug(f"Page {page_index + 1}")
            if page_index == 56:
                LOGGER.info(
                    "Page 57: Ignorée la carrière Cenobite est sur deux pages, elle est traitée à la main."
                )
                continue
            table = tables[0]
            if len(table[0]) == 12:
                career_name = sanitize_text(table[0][0])
                career_response = supabase.rpc(
                    "search_careers", {"search_term": career_name}
                ).execute()
                LOGGER.info(
                    f"Carrière: {career_response.data[0]['name'] if career_response.data else career_name}"
                )
                career_characteristics: dict[str, int] = dict(
                    zip(CHARACTERISTIC_LABELS, sanitize_characteristics(table[3]))
                )
                LOGGER.info(
                    tabulate(
                        [career_characteristics.values()],
                        headers=list(career_characteristics.keys()),
                        tablefmt="grid",
                    )
                )
                i_paths = None
                for i in range(4, len(table)):
                    if "Accès" in (table[i][0] or ""):
                        i_paths = i
                        break
                if i_paths is None:
                    LOGGER.warning(
                        "Aucun chemin de carrière trouvé dans la table pour la carrière '%s'.",
                        career_name,
                    )
                    continue
                career_paths = table[i_paths + 1]
                openings = list(map(sanitize_text, career_paths[6].split("\n")))
                LOGGER.debug("Débouchés de carrière:")
                LOGGER.debug(",".join(openings))

                if career_response.data:
                    paths = []
                    for opening in openings:
                        opening_response = supabase.rpc(
                            "search_careers", {"search_term": opening}
                        ).execute()
                        if opening_response.data:
                            path = [
                                career_response.data[0]["id"],
                                opening_response.data[0]["id"],
                            ]
                        else:
                            LOGGER.warning(
                                f"Opening '{opening}' not found for career '{career_name}', check typo"
                            )
                            failed_careers.append(opening)
                            continue
                        LOGGER.debug(
                            f"Created path: {path[0]} -> {path[1]} for career '{career_name}' and opening '{opening}'"
                        )
                        paths.append(path)
                else:
                    LOGGER.warning(
                        f"Career '{career_name}' not found in the database, check typo"
                    )
                    failed_careers.append(career_name)
                    continue

                careers_data[
                    career_response.data[0]["name"]
                    if career_response.data
                    else career_name
                ] = {"characteristics": career_characteristics, "paths": paths}
                LOGGER.debug(
                    f"Extracted data for career '{career_name}': {careers_data[career_response.data[0]['name'] if career_response.data else career_name]}"
                )
    return careers_data, list(set(failed_careers))


def insert_career_data_to_db(client: Client, careers: list[JSON], json_data: dict):
    """Inserts characteristics and paths from the processed json data into the database tables."""

    # Récupérer la liste ordonnée des codes de statistiques
    stats_response = client.table("static_stats").select("code").order("code").execute()
    stat_codes = [stat["code"] for stat in stats_response.data]

    characteristics_to_insert = []
    paths_to_insert = []

    for career_name, data in json_data.items():
        career_id = get_id_from_name(careers, career_name)
        if not career_id:
            LOGGER.warning(
                f"Attention : Carrière '{career_name}' introuvable en base de données pour l'insertion."
            )
            continue

        # Préparation des caractéristiques
        char_values = data.get("characteristics", {})
        for stat_code, value in char_values.items():
            if value > 0 and stat_code in stat_codes:
                characteristics_to_insert.append(
                    {"career_id": career_id, "stat_code": stat_code, "value": value}
                )

        # Préparation des chemins (paths)
        for path in data.get("paths", []):
            if len(path) == 2:
                paths_to_insert.append(
                    {"from_career_id": path[0], "to_career_id": path[1]}
                )

    # Insertion en masse sécurisée par upsert
    if characteristics_to_insert:
        try:
            client.table("career_characteristics").upsert(
                characteristics_to_insert, on_conflict="career_id,stat_code"
            ).execute()
            LOGGER.info(
                f"Inséré/Mis à jour {len(characteristics_to_insert)} caractéristiques dans career_characteristics."
            )
        except APIError as e:
            LOGGER.error(
                f"APIError sur career_characteristics [{e.code}]: {e.message} - {e.hint}"
            )

        if paths_to_insert:
            try:
                # Déduplication des chemins (transformation en tuples uniques, puis retour en dictionnaires)
                unique_paths = [
                    dict(t) for t in {tuple(sorted(d.items())) for d in paths_to_insert}
                ]

                client.table("career_paths").upsert(
                    unique_paths, on_conflict="from_career_id,to_career_id"
                ).execute()
                LOGGER.info(
                    f"Inséré/Mis à jour {len(unique_paths)} chemins dans career_paths (après déduplication)."
                )
            except APIError as e:
                LOGGER.error(
                    f"APIError sur career_paths [{e.code}]: {e.message} - {e.hint}"
                )


if __name__ == "__main__":
    data, failed_careers = extract_career_data(pdf_path)

    # Ajout du cenobite manuellement
    cenobite_career_name = "Cenobite"
    cenobite_characteristics = dict(
        zip(CHARACTERISTIC_LABELS, [5, 0, 5, 10, 0, 5, 10, 5, 0, 2, 0, 0])
    )
    cenobite_paths = [
        [
            get_id_from_name(careers, cenobite_career_name),
            get_id_from_name(careers, "Hors-la-loi"),
        ],
        [
            get_id_from_name(careers, cenobite_career_name),
            get_id_from_name(careers, "Mystique"),
        ],
        [
            get_id_from_name(careers, cenobite_career_name),
            get_id_from_name(careers, "Serviteur"),
        ],
        [
            get_id_from_name(careers, cenobite_career_name),
            get_id_from_name(careers, "Vagabond"),
        ],
    ]
    data[cenobite_career_name] = {
        "characteristics": cenobite_characteristics,
        "paths": cenobite_paths,
    }

    data_count = len(data)
    careers_count = len(careers)
    LOGGER.warning(
        f"Nombre de carrières extraites du PDF / dans la base de données: {data_count} / {careers_count} = {data_count / careers_count:.2%}"
    )
    if data_count != careers_count:
        LOGGER.warning(
            "Le nombre de carrières extraites du PDF ne correspond pas au nombre de carrières dans la base de données. Voici les carrières manquantes ou en trop:"
        )
        career_names_from_pdf = set(data.keys())
        career_names_from_db = set(career["name"] for career in careers)
        missing_in_pdf = list(career_names_from_db - career_names_from_pdf)
        missing_in_db = list(career_names_from_pdf - career_names_from_db)
        if missing_in_pdf:
            LOGGER.warning(
                "Carrières manquantes dans le PDF: %s", ", ".join(missing_in_pdf)
            )
        if missing_in_db:
            LOGGER.warning(
                "Carrières manquantes dans la base de données: %s",
                ", ".join(missing_in_db),
            )

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    if failed_careers:
        with open(output_failed_careers_path, "w", encoding="utf-8") as f:
            json.dump(failed_careers, f, ensure_ascii=False, indent=4)
    LOGGER.warning("Failed careers: %s", "\n".join(failed_careers))

    # Synchronisation des données extraites vers les tables de la base de données
    insert_career_data_to_db(supabase, careers, data)
