"""Import base map markers from a JSON seed into Supabase (service role, idempotent upsert on external_ref)."""

import json
import logging
import sys
from pathlib import Path
from typing import Any

from supabase import Client

from _common import configure_logging, create_supabase_client, load_env

LOGGER = logging.getLogger(__name__)
SEED_FILE = Path(__file__).resolve().parent / "map_markers_seed.json"
BATCH_SIZE = 100
MAX_LAT = 85.0511
SEED_FIELDS = {"external_ref", "type", "name", "description", "lat", "lng"}


def load_seed(path: Path) -> list[dict[str, Any]]:
    """Read and validate the seed: a JSON array of {external_ref, type, name, description?, lat, lng}."""
    if not path.is_file():
        raise FileNotFoundError(f"Seed file not found: {path}")

    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise TypeError(f"Expected a JSON array in {path}.")

    seen: set[str] = set()
    for index, entry in enumerate(raw, start=1):
        if not isinstance(entry, dict):
            raise TypeError(f"Entry {index} is not a JSON object.")
        unknown = set(entry) - SEED_FIELDS
        if unknown:
            raise ValueError(f"Entry {index} has unsupported fields: {', '.join(sorted(unknown))}.")
        for key in ("external_ref", "type", "name"):
            if not isinstance(entry.get(key), str) or not entry[key].strip():
                raise ValueError(f"Entry {index} has no valid {key}.")
        lat, lng = entry.get("lat"), entry.get("lng")
        if not isinstance(lat, int | float) or not isinstance(lng, int | float) or abs(lat) > MAX_LAT or abs(lng) > 180:
            raise ValueError(f"Entry {index} has invalid coordinates.")
        if entry["external_ref"] in seen:
            raise ValueError(f"Entry {index} duplicates external_ref {entry['external_ref']}.")
        seen.add(entry["external_ref"])

    return raw


def push(client: Client, entries: list[dict[str, Any]]) -> None:
    """Upsert entries in batches, resolving `type` to map_marker_types.id by code."""
    types = {row["code"]: row["id"] for row in client.table("map_marker_types").select("id, code").execute().data}
    missing = {entry["type"] for entry in entries} - set(types)
    if missing:
        raise ValueError(f"Unknown marker type code(s): {', '.join(sorted(missing))}. Add them to map_marker_types first.")

    rows = [
        {
            "external_ref": entry["external_ref"],
            "type_id": types[entry["type"]],
            "name": entry["name"].strip(),
            "description": entry.get("description"),
            "lat": entry["lat"],
            "lng": entry["lng"],
        }
        for entry in entries
    ]
    for start in range(0, len(rows), BATCH_SIZE):
        client.table("map_markers").upsert(rows[start : start + BATCH_SIZE], on_conflict="external_ref").execute()
    LOGGER.info("Upserted %d markers.", len(rows))


def main() -> None:
    """Validate the seed, then upsert it (use --dry-run to validate only)."""
    configure_logging(logging.INFO)
    load_env()
    entries = load_seed(SEED_FILE)
    if "--dry-run" in sys.argv:
        LOGGER.info("Seed valid: %d markers.", len(entries))
        return

    client = create_supabase_client("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
    push(client, entries)


if __name__ == "__main__":
    main()
