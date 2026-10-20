"""Insert missing spells from the compendium JSON into Supabase."""

import json
import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from postgrest.types import ReturnMethod
from supabase import Client, create_client

LOGGER = logging.getLogger(__name__)
MIGRATIONS_DIR = Path(__file__).resolve().parent
SPELLS_FILE = MIGRATIONS_DIR / "compendium_spells_fixed.json"
BATCH_SIZE = 100
EXISTING_PAGE_SIZE = 1000
SPELL_COLUMNS = {
    "range",
    "duration",
    "category",
    "name",
    "difficulty",
    "casting_time",
    "bonus_ingredient",
    "bonus",
    "description",
}


def load_spells(path: Path) -> list[dict[str, Any]]:
    """Load and validate spells from a JSON file."""
    if not path.is_file():
        raise FileNotFoundError(f"Spell data file not found: {path}")

    raw_spells = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw_spells, list):
        raise TypeError(f"Expected a JSON array in {path}.")

    spells: list[dict[str, Any]] = []
    for index, spell in enumerate(raw_spells, start=1):
        if not isinstance(spell, dict):
            raise TypeError(f"Spell at array position {index} is not a JSON object.")
        unknown_fields = set(spell) - SPELL_COLUMNS
        if unknown_fields:
            raise ValueError(f"Spell at array position {index} has unsupported fields: {', '.join(sorted(unknown_fields))}.")
        if not isinstance(spell.get("name"), str) or not spell["name"].strip():
            raise ValueError(f"Spell at array position {index} has no valid name.")
        category = spell.get("category")
        if category is not None and not isinstance(category, str):
            raise ValueError(f"Spell at array position {index} has an invalid category.")
        spells.append(spell)

    LOGGER.info("Loaded %d spells from %s.", len(spells), path)
    return spells


def spell_key(spell: dict[str, Any]) -> tuple[str | None, str]:
    """Return the normalized (category, name) key of a spell."""
    category = spell.get("category")
    normalized_category = category.strip() or None if isinstance(category, str) else None
    return normalized_category, spell["name"].strip()


def get_existing_spell_keys(client: Client) -> set[tuple[str | None, str]]:
    """Return the keys of spells already in the database."""
    existing_keys: set[tuple[str | None, str]] = set()
    offset = 0

    while True:
        response = client.table("spells").select("category,name").order("category").order("name").range(offset, offset + EXISTING_PAGE_SIZE - 1).execute()
        rows = response.data
        for row in rows:
            if not isinstance(row, dict):
                continue
            name = row.get("name")
            category = row.get("category")
            if isinstance(name, str) and (category is None or isinstance(category, str)):
                existing_keys.add(spell_key({"category": category, "name": name}))

        LOGGER.info("Read %d existing spell keys.", len(existing_keys))
        if len(rows) < EXISTING_PAGE_SIZE:
            break
        offset += EXISTING_PAGE_SIZE

    return existing_keys


def insert_missing_spells(client: Client, spells: list[dict[str, Any]]) -> int:
    """Insert spells absent from the database and return the inserted count."""
    existing_keys = get_existing_spell_keys(client)
    pending: list[dict[str, Any]] = []
    seen_input_keys: set[tuple[str | None, str]] = set()
    duplicate_count = 0

    for spell in spells:
        key = spell_key(spell)
        if key in existing_keys or key in seen_input_keys:
            duplicate_count += 1
            continue
        seen_input_keys.add(key)
        pending.append(spell)

    LOGGER.info(
        "Import plan: %d new spells, %d existing or duplicate entries skipped.",
        len(pending),
        duplicate_count,
    )

    inserted_count = 0
    batch_count = (len(pending) + BATCH_SIZE - 1) // BATCH_SIZE
    for batch_number, start in enumerate(range(0, len(pending), BATCH_SIZE), start=1):
        batch = pending[start : start + BATCH_SIZE]
        try:
            client.table("spells").insert(
                batch,
                returning=ReturnMethod.minimal,
            ).execute()
        except Exception:
            LOGGER.exception(
                "Insert failed for batch %d/%d (%d spells). Earlier batches remain committed; rerunning will skip their existing spell keys.",
                batch_number,
                batch_count,
                len(batch),
            )
            raise

        inserted_count += len(batch)
        LOGGER.info(
            "Inserted batch %d/%d: %d spells (%d/%d total).",
            batch_number,
            batch_count,
            len(batch),
            inserted_count,
            len(pending),
        )

    LOGGER.info(
        "Import complete: inserted %d spells; skipped %d existing or duplicate entries.",
        inserted_count,
        duplicate_count,
    )
    return inserted_count


def main() -> None:
    """Run the spell import."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    load_dotenv()

    supabase_url = os.getenv("VITE_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        raise RuntimeError("VITE_SUPABASE_URL and SUPABASE_KEY must be configured.")

    spells = load_spells(SPELLS_FILE)
    client = create_client(supabase_url, supabase_key)
    insert_missing_spells(client, spells)


if __name__ == "__main__":
    main()
