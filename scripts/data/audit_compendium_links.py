"""Compare local compendium skill and talent names without connecting to a database."""

import re
import sqlite3
import unicodedata
from collections import Counter
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[2]
SEED_PATH = ROOT / "data/seed/public_data.sql"
PDF_PATH = ROOT / "data/sources/compendium_skills_talents.pdf"


def normalize(value: str) -> str:
    """Normalize names using the existing extraction script's matching exceptions."""
    value = value.replace("’", "'").replace("-", " ").replace("\n", " ").strip()
    if "Connaissan." in value or value == "Connaissance des pièges":
        value = "Connaissances des pièges"
    value = {"Intriguant": "Intrigant", "Talent artistique": "Talents artistique"}.get(value, value)
    return "".join(character for character in unicodedata.normalize("NFKD", value.casefold()) if not unicodedata.combining(character))


def read_seed(seed: str) -> tuple[list[tuple[str, str | None, str]], list[tuple[str, str | None, str]]]:
    """Load only the skill and talent insert statements into in-memory SQLite."""
    with sqlite3.connect(":memory:") as database:
        database.executescript("CREATE TABLE skills (name TEXT, specialization TEXT, stat_code TEXT, description TEXT, is_basic BOOLEAN);CREATE TABLE talents (name TEXT, description TEXT, specialization TEXT);")
        for table in ("skills", "talents"):
            match = re.search(rf"INSERT INTO {table} \(.+?\) VALUES.*?ON CONFLICT DO NOTHING;", seed, re.DOTALL)
            if match is None:
                raise ValueError(f"Missing seed for {table}")
            database.executescript(match.group().replace("ON CONFLICT DO NOTHING", ""))
        skills = database.execute("SELECT name, specialization, stat_code FROM skills").fetchall()
        talents = database.execute("SELECT name, specialization, description FROM talents").fetchall()
    return skills, talents


def read_pdf(path: Path) -> list[tuple[str, list[str]]]:
    """Extract names from the first detected table on each PDF page."""
    rows = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if not tables:
                continue
            for row in tables[0]:
                if len(row) < 4 or not row[0] or "Compétences" in row[0]:
                    continue
                names = [line.split(":", 1)[0].strip() for line in (row[3] or "").splitlines() if ":" in line]
                rows.append((row[0].strip(), names))
    return rows


def main() -> None:
    """Print an aggregate comparison, including names requiring manual review."""
    seed = SEED_PATH.read_text(encoding="utf-8")
    skills, talents = read_seed(seed)
    skill_names = {normalize(row[0]) for row in skills}
    talent_names = {normalize(row[0]) for row in talents}
    pdf_rows = read_pdf(PDF_PATH)
    pairs = [(skill, talent) for skill, names in pdf_rows for talent in names]
    unmatched_skills = sorted({name for name, _ in pdf_rows if normalize(name) not in skill_names})
    unmatched_talents = sorted({name for _, name in pairs if normalize(name) not in talent_names})
    matched = sum(normalize(skill) in skill_names and normalize(talent) in talent_names for skill, talent in pairs)
    print(f"Seed skills: {len(skills)} rows, {len(skill_names)} unique names, {sum(bool(row[1]) for row in skills)} specialized")
    print(f"Seed talents: {len(talents)} rows, {len(talent_names)} unique names, {sum(bool(row[1]) for row in talents)} specialized")
    print(f"Skill characteristics: {dict(sorted(Counter(row[2] for row in skills).items()))}")
    print(f"PDF: {len(pdf_rows)} skill rows, {len(pairs)} talent mentions, {matched} matched name pairs")
    print(f"Unmatched skill names: {unmatched_skills}")
    print(f"Unmatched talent names: {unmatched_talents}")
    link_insertions = len(re.findall(r"INSERT\s+INTO\s+skills_talents\b", seed, re.IGNORECASE))
    print(f"Seed link insertions: {link_insertions}")


if __name__ == "__main__":
    main()
