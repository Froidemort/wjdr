import re
from collections.abc import Generator

import pdfplumber
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator
from pydantic_ai import Agent

load_dotenv()

TITLE_PATTERN = re.compile(r"^\d+(?:\.\d+)*\) ")

class SpellResult(BaseModel):
    range: str = Field(description="Portée du sort")
    duration: str | None = Field(description="Durée du sort")

class Spell(SpellResult):
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
        return value.strip()

    @field_validator("duration", mode="after")
    @classmethod
    def strip_duration(cls, value: str | None) -> str | None:
        # for the regular spells, duration is in the description text
        return value.strip() if value else None


def clean_text(text: str | None) -> str:
    """Helper utility to normalize whitespace and strip trailing garbage text."""
    if not text:
        return ""
    return " ".join(
        text.replace("’", "'").replace("“", '"').replace("”", '"').split()
    ).strip()

spell_filler_agent = Agent(model="nvidia/nemotron-3-ultra-550b-a55b:free",
                           output_type=SpellResult,
                           system_prompt="""You are an expert in extracting structured spell data from text.
                           You will be provided with raw text from a PDF containing spell tables.
                           Your task is to accurately fill in the fields of the Spell model based on the description provided.""" 
                           )

async def fill_spell_duration_range(spell: Spell) -> SpellResult:
    context_text = f"""
    Nom du sort : {spell.name}
    Catégorie : {spell.category}
    Description : {spell.description}
    """
    result = await spell_filler_agent.run(context_text)
    return SpellResult.model_validate(result.output)


def extract_row_fields(
    cleaned_row: list[str],
) -> tuple[str, str, str, str, str | None, str, str] | None:
    """
    Maps a cleaned table row to (name, diff_raw, casting_time, ingredient, duration, range, description).

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


def stream_spells(pdf_path: str) -> Generator[Spell]:
    """
    Sequentially parses the PDF, extracts table rows, cleans the text data,
    and constructs Spell model objects on-the-fly.

    Yields:
        Generator[Spell, None, None]: Individual initialized Spell instances.
    """

    # Regex to catch bonuses like (+1) or (+2) inside ingredient strings
    bonus_pattern = re.compile(r"\(\s*\+\s*(\d+)\s*\)")

    current_header: str = "Unknown Section"

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            if page_num > 87:
                break
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
                    yield Spell(
                        category=current_header,
                        name=name,
                        difficulty=int(diff_raw),
                        casting_time=casting_time,
                        bonus_ingredient=ingredient_name
                        if ingredient_name
                        else "Aucun",
                        bonus=bonus_value,
                        duration=duration,
                        range=spell_range,
                        description=description,
                    )

            # Update final context fallback if a title sits at the very bottom edge of a page
            if page_titles:
                last_title = max(page_titles, key=lambda t: t["top"])
                if not tables or last_title["top"] > max(t.bbox[3] for t in tables):
                    current_header = last_title["text"]


# --- Consumer execution block ---
if __name__ == "__main__":
    import asyncio
    PDF_FILE_PATH = "migrations/compendium_spells.pdf"

    # Building the final target flat list requested
    all_spells: list[Spell] = []

    print("Extracting spells into active memory objects...")
    try:
        for spell_object in stream_spells(PDF_FILE_PATH):
            spell_duration_range = asyncio.run(fill_spell_duration_range(spell_object))
            spell_object.duration = spell_duration_range.duration
            spell_object.range = spell_duration_range.range
            all_spells.append(spell_object)

        print(
            f"\nProcessing complete! Successfully compiled {len(all_spells)} spell instances."
        )

        # Display validation proofing if database is populated
        if all_spells:
            print("\n--- FIRST SPELL OBJECT PREVIEW ---")
            first = all_spells[0]
            print(f"Category : {first.category}")
            print(f"Name     : {first.name} (Diff: {first.difficulty})")
            print(f"Time     : {first.casting_time} | Range: {first.range}")
            print(f"Item     : {first.bonus_ingredient} [Bonus active: +{first.bonus}]")
            print(f"Desc     : {first.description[:80]}...")
            # Store spells in json:
            import json

            with open("migrations/compendium_spells.json", "w", encoding="utf-8") as f:
                json.dump(
                    [spell.model_dump() for spell in all_spells],
                    f,
                    ensure_ascii=False,
                    indent=4,
                )

    except FileNotFoundError:
        print(f"Could not open file at: {PDF_FILE_PATH}")
