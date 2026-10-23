# Architecture

SPA Vue 3 (`<script setup lang="ts">`) + Supabase. Les fonctions serverless Vercel vivent dans `api/`.

## Structure de `src/`

| Dossier | Rôle |
| --- | --- |
| `views/` | Pages routées |
| `components/` | UI, par domaine : `campaign/`, `character/`, `map/`, `ui/` |
| `composables/` | Logique réutilisable (realtime, hors ligne, carte, graphe de carrières, sessions) |
| `stores/` | Stores Pinia (`auth`, `authForm`, `theme`, `map`, `careerGraph`, `userContext`, `lastActive`, `campaignCreateModal`, `compendiumInventory`, `compendiumSkillsTalents`, `compendiumSpells`) |
| `services/` | Accès aux données : `*Repository.ts`, `offlineSyncService.ts`, `dice.ts`, `shared/` |
| `db/` | Clients : `supabase.ts` (Supabase), `mapTileDb.ts` (Dexie, tuiles) |
| `router/` | Routes et redirections |
| `layouts/`, `assets/`, `config/`, `types/`, `utils/` | Layout, styles, constantes, types, utilitaires |
| `server/` | Logique partagée avec `api/` (`campaignCodeRedirect.ts`) |
| `stories/` | Stories Storybook |
| `wjdr/` | Paquet Python vide (`__init__.py`) |

### Composables de la fiche personnage

`CharacterDetailView.vue` (~360 lignes) délègue à `useCharacterSheet` (orchestrateur : route, chargement, composition des modules) :

- `useCharacterFeedback` : messages de succès/erreur, actions occupées, confirmation de suppression.
- `useCharacterLinks` : compétences, talents, armes, armures, objets liés (tri, cache, mutations).
- `useCharacterEquipment` : équipement/déséquipement armes et armures depuis la silhouette, qualités, suppressions.
- `useCharacterQuickSave` : état éditable, sauvegarde rapide, argent, retry.
- `useCharacterStats` : caractéristiques (ticks, base, avances) et synchro des PV.
- `useCharacterRealtime` : abonnement realtime et rechargement différé.
- `useCharacterCareer` : changement de carrière via le catalogue.
- `useCharacterCatalogActions` : recherche/création d'entrées de catalogue et ajout au personnage.
- `useCharacterDescriptionModal` : modale de description.

## Règles

- Accès aux données uniquement via `src/services/*Repository.ts`.
- Le frontend n'accède qu'aux variables `VITE_*`.
- Types de lignes DB : `src/types/db.ts`.

## Routes (`src/router/routes.ts`)

| Chemin | Accès |
| --- | --- |
| `/`, `/old-world`, `/map`, `/reset-password` | Public |
| `/compendium`, `/compendium/{inventory,careers,spells,skills,talents}` | Public |
| `/characters`, `/characters/:id` | Authentifié |
| `/campaigns`, `/campaigns/:id`, `/campaigns/:campaignId/timeline/:sessionEntryId` | Authentifié |
| `/notifications`, `/profile` | Authentifié |
| `/sessions*` | Redirections vers `/campaigns` (`legacySessionRedirects.ts`) |

## API Vercel

`api/campaigns/[identifier].ts` : rewrite `/campaigns/:identifier` (code de 6 caractères alphanumériques) défini dans `vercel.json`. Résout le code via la RPC `resolve_campaign_code` (migration 013) et redirige en 302 vers `/campaigns/:id`. Les campagnes archivées ne sont accessibles qu'à leur MJ. Limite de débit en mémoire : 10 requêtes par minute et par IP (best-effort).

Les autres chemins sont réécrits vers `index.html` (SPA).
