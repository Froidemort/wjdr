"""Scrape the wjrf.bimondiens.com map town list into public/data/cities.json.

Coordinates come from the `data-latitude` / `data-longitude` attributes of each
`<li>` in `#map-town-list`. The site's OpenLayers map uses EPSG:3857 tiles and
`ol.proj.fromLonLat`, so these values are WGS84 degrees and match the Web Mercator
tile set used by `src/config/map.ts` (Leaflet default CRS) with no conversion.
"""

import html
import json
import re
from pathlib import Path
from typing import TypedDict

import requests

BASE_URL = "https://wjrf.bimondiens.com"
MAPS_URL = f"{BASE_URL}/content/maps/index.php"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "public" / "data" / "cities.json"
ENCODING = "iso-8859-15"
USER_AGENT = "Mozilla/5.0 (personal use; wjdr importer)"

ITEM_SPLIT_RE = re.compile(r'<li id="town-(?=\d+")')
ID_RE = re.compile(r'^(\d+)"')
LAT_RE = re.compile(r'data-latitude="([-\d.]+)"')
LNG_RE = re.compile(r'data-longitude="([-\d.]+)"')
NAME_RE = re.compile(r'data-name="([^"]*)"')
CLASS_RE = re.compile(r'class="collection-item avatar ([^"]*)"')
URL_RE = re.compile(r'<a class="right" href="([^"]+)"')
TITLE_BLOCK_RE = re.compile(r"</b>(.*)$", re.S)
SOURCE_RE = re.compile(r'<b class="title[^>]*>.*?<(?:img|span)[^>]*\stitle="([^"]*)"', re.S)
DETAIL_RE = re.compile(r"^\s*([^(<]+?)\s*\(([^)]*)\)\s*<br\s*/?>\s*(.*?)\s*$", re.S)
POP_RE = re.compile(r"([\d\s\u00a0\u202f]+)\s*hab")


class City(TypedDict):
    """One town entry as written to cities.json."""

    id: int
    name: str
    lat: float
    lng: float
    type: str | None
    population: int | None
    region: str | None
    country: str | None
    subregion: str | None
    url: str | None
    pending: bool
    hidden: bool
    source: str | None


def clean(value: str) -> str:
    """Unescape HTML entities and collapse whitespace."""
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def parse_population(raw: str) -> int | None:
    """Return the population from text like '3 774 hab.', or None when unknown."""
    match = POP_RE.search(raw)
    if match is None:
        return None
    digits = re.sub(r"\D", "", match.group(1))
    return int(digits) if digits else None


def parse_item(chunk: str) -> City | None:
    """Parse one `<li>` chunk (text after `<li id="town-`) into a City."""
    id_match = ID_RE.match(chunk)
    lat_match = LAT_RE.search(chunk)
    lng_match = LNG_RE.search(chunk)
    name_match = NAME_RE.search(chunk)
    if not (id_match and lat_match and lng_match and name_match):
        return None
    class_match = CLASS_RE.search(chunk)
    url_match = URL_RE.search(chunk)
    source_match = SOURCE_RE.search(chunk)
    tail_match = TITLE_BLOCK_RE.search(chunk)
    tail = tail_match.group(1) if tail_match else ""

    town_type: str | None = None
    population: int | None = None
    region: str | None = None
    pending = "En attente de validation" in tail
    detail = DETAIL_RE.match(tail)
    if detail is not None:
        town_type = clean(detail.group(1)) or None
        population = parse_population(clean(detail.group(2)))
        region = clean(re.sub(r"<[^>]+>", "", detail.group(3))) or None

    country: str | None = None
    subregion: str | None = None
    if region is not None:
        country, _, rest = region.partition(", ")
        subregion = rest or None

    return City(
        id=int(id_match.group(1)),
        name=clean(name_match.group(1)),
        lat=float(lat_match.group(1)),
        lng=float(lng_match.group(1)),
        type=town_type,
        population=population,
        region=region,
        country=country,
        subregion=subregion,
        url=f"{BASE_URL}{url_match.group(1)}" if url_match else None,
        pending=pending,
        hidden="hidden" in (class_match.group(1) if class_match else ""),
        source=clean(source_match.group(1)) if source_match else None,
    )


def parse_cities(page: str) -> list[City]:
    """Extract every town of `#map-town-list` from the page HTML, sorted by id."""
    start = page.find('id="map-town-list"')
    if start == -1:
        raise ValueError("map-town-list not found")
    end = page.find("</ul>", start)
    chunks = ITEM_SPLIT_RE.split(page[start:end])[1:]
    cities = [city for city in (parse_item(chunk) for chunk in chunks) if city is not None]
    return sorted(cities, key=lambda city: city["id"])


def fetch_page() -> str:
    """Download the map page (single request, personal use)."""
    # Exception to the no-network rule: scraping the reference site, one request.
    response = requests.get(MAPS_URL, headers={"User-Agent": USER_AGENT}, timeout=30)
    response.raise_for_status()
    return response.content.decode(ENCODING)


def main() -> None:
    """Scrape the town list and write public/data/cities.json."""
    cities = parse_cities(fetch_page())
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(cities, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(cities)} cities -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
