# Données

Détail et ordre d'exécution : [migrations/README.md](../migrations/README.md). Ce fichier ne résume que le flux.

## Flux

1. Migrations SQL `migrations/000` à `017` : appliquées à la main dans l'éditeur SQL de Supabase, par ordre de nom de fichier.
2. Seed `data/seed/public_data.sql` : données du livre de règles, après la migration 000.
3. Scripts Python `scripts/data/` : extraient les PDFs de `data/sources/` ou lisent des sources externes, puis écrivent dans Supabase ou dans `tmp/` et `public/data/`.

## Scripts

| Script | Rôle |
| --- | --- |
| `career_paths_extractor.py` | Carrières, caractéristiques et liens de carrières |
| `skills_talents_links.py` | Liens compétences / talents |
| `weapon_attributes_setter.py` | Attributs des armes |
| `extract_spells.py`, `populate_spells.py` | Extraction puis import des sorts |
| `scrape_cities.py` | `public/data/cities.json` |
| `populate_map_markers.py` | Marqueurs de carte |
| `upload_map_tiles.py` | Envoi des tuiles dans le bucket `map-tiles`, `public/data/map-tiles-index.json` |

Dépendances Python : `pyproject.toml`. Variables des scripts : `scripts/data/_common.py` (`load_env()`).

## Limites connues

Les incohérences entre migrations et scripts sont listées dans [migrations/README.md](../migrations/README.md) (section 5).
