"""Extract spells from the compendium PDF and enrich their range and duration."""

import asyncio
import json
import logging
import os
import re
import time
from collections.abc import Generator
from functools import cache
from pathlib import Path
from typing import Any

import pdfplumber
from dotenv import load_dotenv
from pydantic import BaseModel, Field, TypeAdapter, field_validator
from pydantic_ai import Agent
from pydantic_ai.exceptions import ModelHTTPError

# Here we import the GitHub Copilot model and provider for use with the pydantic_ai agent
# If needed, you can replace this with another model and provider combination.
from pydantic_ai.models.github_copilot import GitHubCopilotModel
from pydantic_ai.providers.github_copilot import GitHubCopilotProvider

from _common import SOURCES_DIR, TMP_DIR

load_dotenv()

LOGGER = logging.getLogger(__name__)
PDF_FILE_PATH = SOURCES_DIR / "compendium_spells.pdf"
OUTPUT_PATH = TMP_DIR / "compendium_spells.json"
OUTPUT_PATH_FIXED = TMP_DIR / "compendium_spells_fixed.json"
TITLE_PATTERN = re.compile(r"^\d+(?:\.\d+)*\) ")
MODEL_NAME = "claude-haiku-4.5"

MAX_REQUESTS_PER_MINUTE = 50
FIXER_BATCH_SIZE = 15
UNKNOWN_MARKERS = {"<UNKNOWN>", "UNKNOWN"}


class SpellResult(BaseModel):
    """Range and duration of a spell."""

    range: str = Field(description="Portée du sort")
    duration: str | None = Field(description="Durée du sort")


class SpellFixResult(BaseModel):
    """Corrected range and duration of an indexed spell."""

    index: int = Field(description="1-based position of the spell in the full input list")
    range: str = Field(description="Corrected concise French range")
    duration: str | None = Field(description="Corrected concise French duration")


class Spell(SpellResult):
    """Spell extracted from the compendium."""

    category: str  # The section title (e.g., "Magie commune de Manann")
    name: str  # Spell name
    difficulty: int  # Minimum roll required (Diff)
    casting_time: str  # Time to cast (Tps)
    bonus_ingredient: str  # Name of the ingredient
    bonus: int  # Numeric modifier from ingredient (e.g., 1 from "(+1)")
    duration: str | None  # Duration of the effect
    range: str  # Range (Portée)
    description: str  # Full spell description text

    @field_validator("category", mode="after")
    @classmethod
    def strip_category(cls, value: str) -> str:
        """Remove the section numbering and surrounding whitespace."""
        return TITLE_PATTERN.sub("", value.strip())

    @field_validator(
        "name",
        "casting_time",
        "bonus_ingredient",
        "range",
        "description",
        mode="after",
    )
    @classmethod
    def strip_text(cls, value: str) -> str:
        """Strip surrounding whitespace."""
        return value.strip()

    @field_validator("duration", mode="after")
    @classmethod
    def strip_duration(cls, value: str | None) -> str | None:
        """Strip whitespace and map empty values to None."""
        return value.strip() if value else None


def clean_text(text: str | None) -> str:
    """Normalize whitespace and common PDF punctuation."""
    if not text:
        return ""
    return " ".join(text.replace("’", "'").replace("“", '"').replace("”", '"').split()).strip()


SpellsList = TypeAdapter(list[Spell])


def is_unresolved(value: str | None) -> bool:
    """Return whether a value is blank or an unknown marker."""
    return value is None or not value.strip() or value.strip().upper() in UNKNOWN_MARKERS


def unresolved_fields(spell: Spell) -> list[str]:
    """Return the range/duration fields of a spell that are unresolved."""
    return [field for field in ("range", "duration") if is_unresolved(getattr(spell, field))]


def get_spells(json_from: list[dict[str, Any]], json_to: list[dict[str, Any]]) -> list[tuple[Spell, Spell]]:
    """Validate two spell lists and pair them by position."""
    spells_from = SpellsList.validate_python(json_from)
    spells_to = SpellsList.validate_python(json_to)
    if len(spells_from) != len(spells_to):
        raise ValueError(f"Spell count mismatch: source has {len(spells_from)}, target has {len(spells_to)}.")
    return list(zip(spells_from, spells_to, strict=True))


def compare(spells_pairs: list[tuple[Spell, Spell]]) -> dict[str, list[str]]:
    """Return range/duration differences per spell name."""
    differences: dict[str, list[str]] = {}
    for spell_from, spell_to in spells_pairs:
        diff = []
        for field in ("range", "duration"):
            value_from = getattr(spell_from, field)
            value_to = getattr(spell_to, field)
            if value_from != value_to:
                diff.append(f"{field}: '{value_from}' -> '{value_to}'")
        differences[spell_from.name] = diff
    return differences


def pprint_diff(json_from_path: Path, json_to_path: Path) -> None:
    """Log range/duration differences between two spell files."""
    json_from = json.loads(json_from_path.read_text(encoding="utf-8"))
    json_to = json.loads(json_to_path.read_text(encoding="utf-8"))
    spell_pairs = get_spells(json_from, json_to)
    differences = compare(spell_pairs)
    changed_count = sum(bool(diff) for diff in differences.values())
    LOGGER.info(
        "Compared %d spells; %d have range/duration changes.",
        len(spell_pairs),
        changed_count,
    )
    for spell_name, diff in differences.items():
        if diff:
            LOGGER.info("%s: %s", spell_name, "; ".join(diff))


def write_spells_json(path: Path, spells: list[Spell]) -> None:
    """Replace a JSON output atomically, preserving the prior file on failure."""
    temporary_path = path.with_suffix(f"{path.suffix}.tmp")
    path.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(
        [spell.model_dump(mode="json") for spell in spells],
        ensure_ascii=False,
        indent=2,
    )
    temporary_path.write_text(f"{content}\n", encoding="utf-8")
    temporary_path.replace(path)


def validate_fixed_spells(original: list[Spell], fixed: list[Spell]) -> None:
    """Check that fixed spells only changed range/duration and are all resolved."""
    if len(original) != len(fixed):
        raise ValueError(f"Fixer changed spell count: expected {len(original)}, received {len(fixed)}.")

    unresolved: list[str] = []
    for index, (source, result) in enumerate(zip(original, fixed, strict=True), start=1):
        if (source.category, source.name) != (result.category, result.name):
            raise ValueError(f"Fixer changed spell identity/order at item {index}: expected '{source.category} / {source.name}', received '{result.category} / {result.name}'.")
        if source.model_dump(exclude={"range", "duration"}) != result.model_dump(exclude={"range", "duration"}):
            raise ValueError(f"Fixer modified fields other than range/duration for '{source.name}'.")
        fields = unresolved_fields(result)
        if fields:
            unresolved.append(f"{result.name} ({', '.join(fields)})")

    if unresolved:
        raise ValueError("Unresolved spell fields remain; fixed output was not written: " + "; ".join(unresolved))


def apply_spell_fix_results(original: list[Spell], results: list[SpellFixResult], start_index: int) -> list[Spell]:
    """Apply fixer results to a batch of spells."""
    if len(original) != len(results):
        raise ValueError(f"Fixer changed batch count: expected {len(original)}, received {len(results)}.")

    fixed: list[Spell] = []
    for offset, (source, result) in enumerate(zip(original, results, strict=True)):
        expected_index = start_index + offset + 1
        if result.index != expected_index:
            raise ValueError(f"Expected result index {expected_index}, received {result.index}.")
        fixed.append(
            source.model_copy(
                update={
                    "range": result.range.strip(),
                    "duration": result.duration.strip() if result.duration else None,
                }
            )
        )

    validate_fixed_spells(original, fixed)
    return fixed


@cache
def initialize_spell_filler_agent() -> Agent[object, SpellResult]:
    """Build the agent that fills spell range and duration."""
    provider = GitHubCopilotProvider(api_key=os.getenv("GITHUB_TOKEN"))
    model = GitHubCopilotModel(MODEL_NAME, provider=provider)
    spell_filler_agent = Agent(
        model=model,
        output_type=SpellResult,
        system_prompt=(
            "You extract Warhammer Fantasy Roleplay spell range and duration from French source text.\n\n"
            "Return concise French values grounded in the supplied spell data. Prefer an explicit value in the description or existing table fields. Use the other fields only to resolve clear references; do not "
            "invent mechanics or infer a value solely from the spell's name or category.\n\n"
            'Normalize equivalent wording consistently: "Instantané" and "Immédiat" mean the same duration; "Personnel" and "Contact (vous)" mean the same range, while "Contact" alone is distinct. Express a '
            'duration based on the value of magic as "X/Mag". Use "Spécial" only when the source describes a conditional, variable, or otherwise special value.\n\n'
            'Never return an empty value, null, "UNKNOWN", or "<UNKNOWN>". If the supplied text does not support a value, make the best evidence-based inference from the complete spell entry and state the concise '
            "result rather than copying a placeholder."
        ),
    )
    return spell_filler_agent


def initialize_spells_fixer_agent() -> Agent[object, list[SpellFixResult]]:
    """Build the agent that normalizes spell range and duration."""
    provider = GitHubCopilotProvider(api_key=os.getenv("GITHUB_TOKEN"))
    model = GitHubCopilotModel(MODEL_NAME, provider=provider)
    spells_fixer_agent = Agent(
        model=model,
        output_type=list[SpellFixResult],
        system_prompt=(
            "You normalize range and duration for Warhammer Fantasy Roleplay spells in French.\n\n"
            '    Process only the spell entries in the current input batch. Resolve every blank, null, "UNKNOWN", or "<UNKNOWN>" range/duration using that spell\'s description and explicit evidence from comparable '
            "entries. Do not use the spell name or category alone to guess. Keep already supported values unless a clear inconsistency requires canonical normalization.\n\n"
            '    Use concise values. Normalize "Instantané" and "Immédiat" consistently. Normalize "Personnel" and "Contact (vous)" as equivalent, but do not conflate either with "Contact". Express duration tied '
            'to the value of magic as "X/Mag". Use "Spécial" only for a value the text makes conditional, variable, or genuinely special. Never return blank, null, "UNKNOWN", or "<UNKNOWN>"; make the strongest '
            "evidence-based resolution available.\n\n"
            "    Return a JSON array with exactly one object per input entry, in the same order. Each object contains only its exact input index, range, and duration. Copy the index exactly. Do not return names "
            "or any other spell fields."
        ),
    )
    return spells_fixer_agent


async def fill_spell_duration_range(spell: Spell) -> SpellResult:
    """Ask the model for a spell's range and duration."""
    context_text = f"""
    Entrée du sort :
    Nom : {spell.name}
    Catégorie : {spell.category}
    Difficulté : {spell.difficulty}
    Temps d'incantation : {spell.casting_time}
    Portée actuelle : {spell.range or "<UNKNOWN>"}
    Durée actuelle : {spell.duration or "<UNKNOWN>"}
    Description : {spell.description}

    Remplace uniquement les valeurs absentes ou incorrectes de portée et durée. Réponds avec des valeurs françaises courtes, jamais avec un marqueur inconnu.
    """
    result = await initialize_spell_filler_agent().run(context_text)
    return SpellResult.model_validate(result.output)


def extract_row_fields(
    cleaned_row: list[str],
) -> tuple[str, str, str, str, str | None, str, str] | None:
    """Map a cleaned table row to (name, diff_raw, casting_time, ingredient, duration, range, description).

    Spell tables come in two layouts depending on the section:
    - 8 columns: Nom, Diff, Tps, Ingrédient, Durée, Portée, Description, Source
    - 6 columns: Nom, Diff, Tps, Ingrédient, Description, Source (no Durée/Portée)

    Returns None if the row doesn't match either layout or isn't a data row (e.g. a header).
    """
    col_count = len(cleaned_row)
    if col_count >= 7:
        duration_idx, range_idx, description_idx = 4, 5, 6
    elif col_count == 6:
        duration_idx, range_idx, description_idx = None, None, 4
    else:
        return None

    diff_raw = cleaned_row[1]
    if not diff_raw.isdigit():
        return None

    return (
        cleaned_row[0],
        diff_raw,
        cleaned_row[2],
        cleaned_row[3],
        cleaned_row[duration_idx] if duration_idx is not None else None,
        cleaned_row[range_idx] if range_idx is not None else "",
        cleaned_row[description_idx],
    )


def stream_spells(pdf_path: str | Path) -> Generator[Spell]:
    """Sequentially parse the PDF, extract table rows, clean the text data.

    Constructs Spell model objects on-the-fly.

    Yields:
        Generator[Spell, None, None]: Individual initialized Spell instances.
    """
    # Regex to catch bonuses like (+1) or (+2) inside ingredient strings
    bonus_pattern = re.compile(r"\(\s*\+\s*(\d+)\s*\)")

    current_header: str = "Unknown Section"
    spell_count = 0

    LOGGER.info("Opening spell PDF: %s", pdf_path)
    with pdfplumber.open(pdf_path) as pdf:
        LOGGER.info("PDF contains %d pages; processing pages 1 through 87.", len(pdf.pages))
        for page_num, page in enumerate(pdf.pages, start=1):
            if page_num > 87:
                break
            page_spell_count = 0
            # 1. Parse text lines to update context header state
            text_objects = page.extract_text_lines()
            page_titles = []
            for obj in text_objects:
                line_text = clean_text(obj["text"])
                if TITLE_PATTERN.match(line_text):
                    page_titles.append({"text": line_text, "top": obj["top"]})

            # 2. Extract tables natively
            tables = page.find_tables()

            for table in tables:
                table_top = table.bbox[1]
                titles_above = [t for t in page_titles if t["top"] < table_top]
                if titles_above:
                    current_header = max(titles_above, key=lambda t: t["top"])["text"]

                raw_rows = table.extract()
                if not raw_rows:
                    continue

                for row in raw_rows:
                    # Clean columns immediately to avoid working on blank/broken artifacts
                    cleaned_row = [clean_text(cell) for cell in row]

                    # Skip header/broken rows and detect the 6 vs 8 column table layout
                    fields = extract_row_fields(cleaned_row)
                    if fields is None:
                        continue
                    (
                        name,
                        diff_raw,
                        casting_time,
                        raw_ingredient,
                        duration,
                        spell_range,
                        description,
                    ) = fields

                    # Parse ingredients to isolate the explicit integer bonus
                    bonus_value = 0
                    bonus_match = bonus_pattern.search(raw_ingredient)
                    if bonus_match:
                        bonus_value = int(bonus_match.group(1))
                        # Remove the "(+1)" substring from the ingredient name descriptor
                        ingredient_name = bonus_pattern.sub("", raw_ingredient).strip()
                    else:
                        ingredient_name = raw_ingredient

                    # Yield the populated data wrapper safely
                    spell = Spell(
                        category=current_header,
                        name=name,
                        difficulty=int(diff_raw),
                        casting_time=casting_time,
                        bonus_ingredient=ingredient_name if ingredient_name else "Aucun",
                        bonus=bonus_value,
                        duration=duration,
                        range=spell_range,
                        description=description,
                    )
                    spell_count += 1
                    page_spell_count += 1
                    yield spell

            LOGGER.info(
                "Page %d/%d: extracted %d spells (%d total).",
                page_num,
                min(len(pdf.pages), 87),
                page_spell_count,
                spell_count,
            )

            # Update final context fallback if a title sits at the very bottom edge of a page
            if page_titles:
                last_title = max(page_titles, key=lambda t: t["top"])
                if not tables or last_title["top"] > max(t.bbox[3] for t in tables):
                    current_header = last_title["text"]


class SlidingWindowRateLimiter:
    """Limit requests per minute over a sliding window."""

    def __init__(self, max_requests_per_minute: int) -> None:
        """Initialize the limiter."""
        self.max_rpm = max_requests_per_minute
        self.requests: list[float] = []
        self.lock = asyncio.Lock()

    async def wait_if_needed(self) -> None:
        """Sleep until a request slot is available."""
        async with self.lock:
            now = time.monotonic()
            self.requests = [t for t in self.requests if now - t < 60]

            if len(self.requests) >= self.max_rpm:
                oldest_request = self.requests[0]
                sleep_time = 60 - (now - oldest_request)

                if sleep_time > 0:
                    LOGGER.info(
                        "Rate limit reached (%d requests); waiting %.2f seconds.",
                        len(self.requests),
                        sleep_time,
                    )
                    await asyncio.sleep(sleep_time)

                now = time.monotonic()
                self.requests = [t for t in self.requests if now - t < 60]

            self.requests.append(time.monotonic())


async def process_with_rate_limit(limiter: SlidingWindowRateLimiter, spell: Spell) -> Spell:
    """Enrich a spell with the model, respecting the rate limit."""
    await limiter.wait_if_needed()
    LOGGER.info("Enriching '%s' (%s).", spell.name, spell.category)
    try:
        result = await fill_spell_duration_range(spell)
    except ModelHTTPError as error:
        LOGGER.error(
            "Model request failed for '%s' with HTTP %d.",
            spell.name,
            error.status_code,
        )
        if error.status_code in (429, 503):
            LOGGER.info("Waiting 60 seconds before one retry for '%s'.", spell.name)
            await asyncio.sleep(60)
            result = await fill_spell_duration_range(spell)
        else:
            raise
    except Exception:
        LOGGER.exception("Unexpected enrichment failure for '%s'.", spell.name)
        raise

    spell.range = result.range
    spell.duration = result.duration
    fields = unresolved_fields(spell)
    if fields:
        LOGGER.warning(
            "'%s' still has unresolved fields after enrichment: %s",
            spell.name,
            ", ".join(fields),
        )
    else:
        LOGGER.info(
            "Enriched '%s': range=%r, duration=%r.",
            spell.name,
            spell.range,
            spell.duration,
        )
    return spell


async def execute_spell_enrichment() -> list[Spell]:
    """Extract spells from the PDF and enrich unresolved range/duration values."""
    if not PDF_FILE_PATH.is_file():
        raise FileNotFoundError(f"Spell PDF not found: {PDF_FILE_PATH}")

    LOGGER.info("Starting PDF extraction.")
    base_spells = list(stream_spells(PDF_FILE_PATH))
    if not base_spells:
        raise ValueError(f"No spells were extracted from {PDF_FILE_PATH}.")
    LOGGER.info(
        "Extracted %d spells; enriching missing range/duration values.",
        len(base_spells),
    )
    write_spells_json(OUTPUT_PATH, base_spells)

    limiter = SlidingWindowRateLimiter(MAX_REQUESTS_PER_MINUTE)
    for index, spell in enumerate(base_spells, start=1):
        if unresolved_fields(spell):
            await process_with_rate_limit(limiter, spell)
        write_spells_json(OUTPUT_PATH, base_spells)
        LOGGER.info(
            "Checkpoint saved: %d/%d spells processed in %s.",
            index,
            len(base_spells),
            OUTPUT_PATH,
        )

    unresolved_count = sum(bool(unresolved_fields(spell)) for spell in base_spells)
    LOGGER.info(
        "Extraction/enrichment complete: %d spells; %d still need fixer resolution.",
        len(base_spells),
        unresolved_count,
    )
    return base_spells


async def execute_spells_fixes(spells: list[Spell]) -> list[Spell]:
    """Normalize range and duration of all spells in batches."""
    if not spells:
        return []

    known_ranges = sorted({spell.range.strip() for spell in spells if not is_unresolved(spell.range)})[:30]
    known_durations = sorted({spell.duration.strip() for spell in spells if spell.duration and not is_unresolved(spell.duration)})[:30]
    reference_values = json.dumps(
        {"range": known_ranges, "duration": known_durations},
        ensure_ascii=False,
        separators=(",", ":"),
    )

    limiter = SlidingWindowRateLimiter(MAX_REQUESTS_PER_MINUTE)
    fixed_spells: list[Spell] = []
    batch_count = (len(spells) + FIXER_BATCH_SIZE - 1) // FIXER_BATCH_SIZE

    for batch_index, start in enumerate(
        range(0, len(spells), FIXER_BATCH_SIZE),
        start=1,
    ):
        batch = spells[start : start + FIXER_BATCH_SIZE]
        end = start + len(batch)
        LOGGER.info(
            "Fixing batch %d/%d, spells %d-%d of %d (%d entries).",
            batch_index,
            batch_count,
            start + 1,
            end,
            len(spells),
            len(batch),
        )
        await limiter.wait_if_needed()
        indexed_batch = [{"index": start + offset + 1, "spell": spell.model_dump(mode="json")} for offset, spell in enumerate(batch)]
        context = f"""Resolve range and duration for this batch only.
Use these values already present elsewhere only as normalization references, not as assumptions: {reference_values}
Return exactly {len(batch)} result objects, preserving the supplied indices and order. Each result must contain only index, range, and duration.

Indexed batch data:
{json.dumps(indexed_batch, ensure_ascii=False, separators=(",", ":"))}
"""
        result = await initialize_spells_fixer_agent().run(context)
        try:
            fixed_batch = apply_spell_fix_results(batch, result.output, start)
        except ValueError as error:
            raise ValueError(f"Fixer returned an invalid result for batch {batch_index}/{batch_count} (spells {start + 1}-{end}): {error}") from error

        fixed_spells.extend(fixed_batch)
        LOGGER.info(
            "Validated batch %d/%d; %d/%d spells fixed.",
            batch_index,
            batch_count,
            len(fixed_spells),
            len(spells),
        )

    return fixed_spells


async def main_async() -> None:
    """Run extraction, enrichment and the fixer pass."""
    if not os.getenv("GITHUB_TOKEN"):
        raise RuntimeError("GITHUB_TOKEN is required for spell enrichment.")

    if OUTPUT_PATH.exists():
        LOGGER.info("Loading existing extraction data: %s", OUTPUT_PATH)
        spell_list = SpellsList.validate_python(json.loads(OUTPUT_PATH.read_text(encoding="utf-8")))
    else:
        spell_list = await execute_spell_enrichment()

    if not spell_list:
        raise ValueError(f"No spells found in {OUTPUT_PATH}.")

    unresolved_before = sum(bool(unresolved_fields(spell)) for spell in spell_list)
    LOGGER.info(
        "Starting consistency pass for %d spells (%d contain unresolved values).",
        len(spell_list),
        unresolved_before,
    )
    fixed_spells = await execute_spells_fixes(spell_list)
    validate_fixed_spells(spell_list, fixed_spells)
    write_spells_json(OUTPUT_PATH_FIXED, fixed_spells)
    LOGGER.info("Validated fixed spell data written to %s.", OUTPUT_PATH_FIXED)
    pprint_diff(OUTPUT_PATH, OUTPUT_PATH_FIXED)


def main() -> None:
    """Run the spell extraction pipeline."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    asyncio.run(main_async())


# --- Consumer execution block ---
if __name__ == "__main__":
    main()
