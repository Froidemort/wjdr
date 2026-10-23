# Fonctionnalités

Les chemins sont relatifs à la racine du dépôt. Routes : voir [architecture.md](architecture.md).

## Compte, campagnes, notifications

- Auth Supabase (email + nom d'utilisateur), profil et avatar, réinitialisation de mot de passe : `src/stores/auth.ts`, `src/views/ProfileView.vue`, `src/views/ResetPasswordView.vue`.
- Campagnes, invitations, demandes d'accès : `src/services/campaignsRepository.ts`, `invitationsRepository.ts`, `usersCampaignsRepository.ts`, `src/views/Campaign*View.vue`.
- Notifications : `src/services/notificationsRepository.ts`, `src/views/NotificationsView.vue`.
- Lien court `/campaigns/<code à 6 caractères>` résolu par `api/campaigns/[identifier].ts`.

## Sessions de campagne

- Sessions datées et notes en markdown (rendu sécurisé via DOMPurify) : `src/services/sessionsRepository.ts`, `sessionNotesRepository.ts`.
- Frise chronologique d'une campagne et détail d'une entrée : `/campaigns/:campaignId/timeline/:sessionEntryId`.
- UI : `src/components/campaign/` (prochaine session, création, éditeur markdown) ; logique : `src/composables/useCampaignSessions.ts`, `src/utils/campaignSessions.ts`.
- Anciennes URLs `/sessions*` redirigées vers `/campaigns`.

## Personnages

- Liste et feuille de personnage (caractéristiques, XP, ressources, inventaire, carrière) : `src/views/Character*View.vue`, `src/components/character/`, `src/composables/useCharacterSheet.ts`.
- Accès : `src/services/charactersRepository.ts`, `characterLinksRepository.ts`, `catalogRepository.ts`.
- Dés : `src/services/dice.ts`.

## Compendium (public)

- Inventaire (armes, armures, objets) : `/compendium/inventory`, store `compendiumInventory`.
- Carrières : `/compendium/careers`.
- Sorts : `/compendium/spells`, store `compendiumSpells` (table `spells`, migrations 010-011).
- Compétences et talents : `/compendium/skills`, `/compendium/talents`, store `compendiumSkillsTalents` (table `skills_talents`, migrations 008, 016).
- Accès : `src/services/compendiumRepository.ts`.

## Graphe de carrières

- Vue : `src/views/CompendiumCareerGraphView.vue` (Vue Flow, dagre, graphology).
- Logique : `src/stores/careerGraph.ts`, `src/composables/useCareerGraph.ts`, `src/services/careersRepository.ts`.
- Données : tables `career_paths` et `career_characteristics` (migrations 006, 012), alimentées par `scripts/data/career_paths_extractor.py`.

## Carte et tuiles

- `/map` : carte Leaflet publique, marqueurs de campagne si une campagne est en contexte ; `/old-world` : carte statique.
- Code : `src/views/MapView.vue`, `src/components/map/`, `src/stores/map.ts`, `src/composables/useLeafletMap.ts`, `src/services/mapRepository.ts`, `citiesRepository.ts`.
- Tuiles : bucket Supabase privé `map-tiles` (migration 017), lu via `src/services/mapTilesRepository.ts`, index dans `public/data/map-tiles-index.json`.
- Cache des tuiles : IndexedDB (Dexie `wjdr-map-tiles`, repli sur l'API Cache) via `src/utils/mapTileCache.ts`, préchargement dans `src/composables/useMapTilePrefetch.ts`.

## Hors ligne et temps réel

- File d'attente Dexie (`wjdr-offline-queue`) pour les mises à jour de personnages et de sessions : `src/services/offlineQueueRepository.ts`, `offlineSyncService.ts`, `src/composables/useOfflineQueueSync.ts`. Les entrées sont rattachées à l'utilisateur connecté.
- Mises à jour optimistes : `src/composables/useOptimisticUpdate.ts`.
- Realtime Supabase (sessions, personnages, notifications) : `src/composables/useRealtimeSync.ts`, `useRealtimeChannels.ts`.
