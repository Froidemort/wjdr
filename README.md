# Warhammer RPG App

Companion app pour le jeu de rôle Warhammer Fantasy (seconde édition) : campagnes, sessions, personnages, compendium et carte. Les mises à jour de personnages et de sessions fonctionnent hors ligne.

## Stack

- Vue 3.5, TypeScript, Pinia, vue-router
- Tailwind CSS 4, daisyUI 5
- Supabase (Auth, Postgres, Realtime, Storage), Dexie (cache hors ligne)
- Leaflet (carte), Vue Flow + dagre + graphology (graphe de carrières)
- Vite, Vitest, Playwright, Storybook
- Déploiement Vercel (`api/`)

## Prérequis

- Node.js 24 (version utilisée par la CI), npm
- Projet Supabase
- Python 3.13+ (scripts de données uniquement, voir `pyproject.toml`)

## Démarrage rapide

```bash
npm install
npm run dev
```

Récupération de mot de passe : ajouter `https://VOTRE_DOMAINE/reset-password` (et l'URL locale, par exemple `http://localhost:5173/reset-password`) aux Redirect URLs de Supabase Auth.

### Variables d'environnement

Pour le développement, créer un fichier `.env` à la racine:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY # ou VITE_SUPABASE_PUBLISHABLE_KEY
```

La fonction `api/campaigns/[identifier].ts` (Vercel) lit `SUPABASE_URL` et `SUPABASE_ANON_KEY`, avec repli sur les variables `VITE_*`.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | `vue-tsc -b` puis build Vite |
| `npm run preview` | Prévisualise le build |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run typecheck` | `vue-tsc -b` |
| `npm run test:unit` | Tests unitaires Vitest |
| `npm run test:storybook` | Tests de composants (projet Vitest `storybook`) |
| `npm run test:e2e` | Playwright (voir [docs/testing.md](docs/testing.md)) |
| `npm run storybook` | Storybook sur le port 6006 |
| `npm run coverage` | Couverture des tests unitaires |
| `npm run knip` | Détection de code mort |

## Organisation du dépôt

| Dossier | Contenu |
| --- | --- |
| `src/` | Application Vue (détail dans [docs/architecture.md](docs/architecture.md)) |
| `api/` | Fonctions serverless Vercel |
| `migrations/` | Migrations SQL Supabase (ordre d'exécution : [migrations/README.md](migrations/README.md)) |
| `scripts/data/` | Scripts Python d'extraction et d'import de données |
| `data/seed/` | Seed SQL des données du livre de règles |
| `data/sources/` | PDFs sources des scripts |
| `public/data/` | JSON statiques générés (villes, index des tuiles) |
| `tests/` | Tests `unit/`, `e2e/`, `setup/` |
| `tmp/` | Sorties locales des scripts, ignoré par git |

## Données

Migrations, seed, scripts Python et leur ordre : [migrations/README.md](migrations/README.md). Vue d'ensemble : [docs/data-pipeline.md](docs/data-pipeline.md).

## Fonctionnalités

Détail dans [docs/features.md](docs/features.md) :

- Authentification, profil, campagnes, invitations, notifications
- Sessions de campagne et notes en markdown
- Personnages et feuille de personnage
- Compendium (inventaire, carrières, sorts, compétences, talents)
- Graphe de carrières
- Carte interactive et tuiles hors ligne
- Mode hors ligne et synchronisation temps réel

## Documentation

- [docs/architecture.md](docs/architecture.md) : structure de `src/`, routes, couche données
- [docs/features.md](docs/features.md) : fonctionnalités et fichiers associés
- [docs/data-pipeline.md](docs/data-pipeline.md) : base, seed et scripts
- [docs/testing.md](docs/testing.md) : tests unitaires, e2e, Storybook, CI
- [AGENTS.md](AGENTS.md) : conventions pour les agents

## Crédits

Les PDFs `data/sources/compendium_*.pdf` proviennent du [forum Warhammer](https://www.warhammer-forum.com/topic/270712-compendium-divers-wjdr-v2/), grâce au travail de *Balian de Troy*.

## Notes

- UI en français
- Identifiants et structure de code en anglais
