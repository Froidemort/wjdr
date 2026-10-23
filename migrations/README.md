# Base de données et données : ordre d'exécution

Les migrations SQL sont appliquées à la main dans l'éditeur SQL de Supabase.

## 1. Migrations SQL (`migrations/`)

Ordre : tri par nom de fichier (`000` puis `001`..`017`).

| Fichier | Dépend de |
| --- | --- |
| `000_public_schema.sql` | Baseline (dump), appliquée en premier. Crée tables, fonctions et RLS de base |
| `001_rename_sessions_to_campaigns` | `sessions`, fonctions `get_session_*` de 000 |
| `002_create_sessions_table` | `campaigns` (001) |
| `003_update_rls_policies` | `campaigns`, `users_campaigns`, `sessions` (002), `session_notes` |
| `004_unique_campaign_code` | `campaigns` |
| `005_fix_campaign_read_policy_for_mj` | `campaigns` (003) |
| `006_add_career_characteristics` | `careers`, `stats` (voir §5) |
| `007_add_armors_category` | `armors` |
| `007_drop_characters_pv_max` | `characters`, `character_stat_values` |
| `008_add_skills_talents_table` | `skills`, `talents` |
| `009_add_destiny_max` | `characters` |
| `010_add_spells` | Aucune |
| `011_grant_spells_sequence_access` | `spells` (010) |
| `012_grant_career_graph_read` | `careers`, `career_paths` |
| `013_resolve_campaign_code_rpc` | `campaigns` |
| `014_security_hardening` | `campaigns`, `career_characteristics` (006), `skills_talents` (008), fonctions d'aide de 000 |
| `015_mj_read_campaign_characters` | `characters`, tables de liens, `campaigns` |
| `016_grant_skills_talents_public_read` | `skills_talents` (008), `skills`, `talents` |
| `017_maps` | `campaigns`, `is_session_mj` (000), `storage.objects` ; crée le bucket `map-tiles` |

Numéro `007` en double : `007_add_armors_category.sql` et `007_drop_characters_pv_max.sql` (dont l'en-tête dit « 008 »). Le tri par nom place `add_armors_category` avant `drop_characters_pv_max` ; les deux sont indépendantes, l'ordre est sans effet.

## 2. Seed manuel : `data/seed/public_data.sql`

À exécuter après 000 (aucune autre migration requise).

| Cible INSERT | Prérequis |
| --- | --- |
| `static_stats` | 000 |
| `skills` | 000, `static_stats` |
| `talents`, `careers`, `weapons`, `armors`, `weapon_attributes` | 000 |

## 3. Scripts Python (`scripts/data/`)

Variables d'environnement via `_common.load_env()`. Clé par défaut : `VITE_SUPABASE_URL` + `SUPABASE_KEY` ; scripts « service role » : `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

| Ordre | Script | Prérequis | Lit | Écrit |
| --- | --- | --- | --- | --- |
| 1 | `career_paths_extractor.py` | 000, 006, seed (`careers`, `static_stats`), RPC `search_careers` | `data/sources/compendium_carrieres_modifie.pdf` ; table `careers` | tables `career_characteristics`, `career_paths` ; `tmp/career_data.json`, `tmp/failed_careers.json`, `careers.json` (cwd) |
| 2 | `skills_talents_links.py` | 008, seed (`skills`, `talents`) | `data/sources/compendium_skills_talents.pdf` | table `skills_talents` ; `tmp/skills_talents_links_dry_run.json` |
| 3 | `weapon_attributes_setter.py` | 000, seed (`weapons`, `weapon_attributes`), colonne `weapons.is_melee` | tables `weapons`, `weapon_attributes` ; JSON optionnel en argument | tables `weapons` (`is_melee`), `weapon_attribute_mappings` ; `weapon_attributes.json` (cwd) |
| 4a | `extract_spells.py` | `GITHUB_TOKEN` | `data/sources/compendium_spells.pdf` | `tmp/compendium_spells.json`, `tmp/compendium_spells_fixed.json` |
| 4b | `populate_spells.py` | 010, 011, 4a | `tmp/compendium_spells_fixed.json` ; table `spells` | table `spells` |
| 5a | `scrape_cities.py` | Réseau | Site `wjrf.bimondiens.com` | `public/data/cities.json` |
| 5b | `populate_map_markers.py` (`--dry-run`) | 017 | `scripts/data/map_markers_seed.json` | tables `map_markers` (type via `map_marker_types`) |
| 5c | `upload_map_tiles.py` (`--index-only`, `--dry-run`, `--force`) | 017 (bucket `map-tiles`) | `tmp/tiles/{z}/{x}/{y}.jpg` | bucket `map-tiles` ; `public/data/map-tiles-index.json` |

Les étapes 1 à 3 sont indépendantes entre elles ; 4a avant 4b ; le groupe 5 est indépendant des autres.

## 4. Sorties générées

| Dossier | Fichier | Écrit par |
| --- | --- | --- |
| `tmp/` | `career_data.json`, `failed_careers.json` | `career_paths_extractor.py` |
| `tmp/` | `skills_talents_links_dry_run.json` | `skills_talents_links.py` |
| `tmp/` | `compendium_spells.json`, `compendium_spells_fixed.json` | `extract_spells.py` |
| `tmp/` | `compendium_spells_final.json`, `compendium_spells.save.json`, `tiles/`, `wjdr.mbtiles`, `wjdr.pmtiles` | Aucun script du dépôt (manuel / outil externe) |
| `public/data/` | `cities.json` | `scrape_cities.py` |
| `public/data/` | `map-tiles-index.json` | `upload_map_tiles.py` |

`tmp/` est ignoré par git (`.gitignore`) et local uniquement.

## 5. Incohérences connues

| Constat | Détail |
| --- | --- |
| `006` référence `public.stats(code)` | Aucune table `stats` dans les migrations (000 crée `static_stats`) |
| `weapons.is_melee` | Utilisée par `weapon_attributes_setter.py`, créée par aucune migration |
| RPC `search_careers` | Appelée par `career_paths_extractor.py`, définie par aucune migration |
| `skills_talents_links` | Écrite par `skills_talents_links.py` (mode direct), la table s'appelle `skills_talents` |
| `map_markers_seed.json` | Attendu par `populate_map_markers.py`, absent de `scripts/data/` |
| Tuiles | Aucun script ne génère `tmp/tiles/` depuis `wjdr.mbtiles` |
