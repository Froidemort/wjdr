## Plan: Roadmap RPG Warhammer V2

Objectif: créer l'app actuelle en application multi-utilisateur online-first avec Supabase Auth, sessions MJ/joueurs, droits d'accès, temps réel de synchronisation, et UX orientée jeu de rôle. Approche recommandée: livrer par vertical slices (auth -> sessions -> personnages -> notifications -> dés), avec migrations SQL + RLS dès le début pour éviter les réécritures de sécurité.
Les explications doivent être minimales, le plan doit être clair et concis pour un développeur expérimenté. Les dépendances entre phases doivent être explicites. Les décisions d'architecture doivent être listées et justifiées en peu de mots. Les fichiers pertinents doivent être listés pour chaque phase. Les vérifications de QA doivent être listées pour chaque phase.

**NOTE** Les vues de detail pour la session et les personnages sont en "live update".
Plus précisément le live update partiel et par batching queue.
Côté UI, on utilisera les card autant que possible, surtout pour du responsive mobile.
Cercle de priorité des données pour le detail des personnages :
0. Nom, race, carrière. (compact)
1. B (Points de vie), Points de fortune, Points de Destin (disponible dans la "zone du pouce" sur mobile)
2. Argent (couronne, pistoles, sous), Expérience totale et expérience disponible, encombrement total
3. Caractéristiques primaires et secondaires (base + avancée + avancée totale + total, avec total en premier), armes, armures, compétences, talents, équipements

**UTILISER TAILWIND ET DAISYUI POUR LES COMPOSANTS, PAS DE CSS CUSTOM.**
**N'UTILISE QUE LUCIDE ICONS https://lucide.dev/ POUR LES ICONES, PAS D'AUTRES PACKS.**
**VUE 3 + VITE + TYPESCRIPT + PINIA + SUPABASE en stack OBLIGATOIRE + VUE en MODE COMPOSABLE (cf sources existantes)**

**Écrans à livrer**
1. Accueil (HomeView) - présentation du jeu, boutons inscription/connexion
2. Liste des sessions
3. Détail d'une session pour le MJ et pour le joueur (différents droits).
4. Détail d'un personnage pour le MJ et pour le joueur (différents droits).
5. Login/inscription (modal ==> pas une vue séparée)


**NOTE** La base de données vient avec des données pour les armes, armures, carrières, compétences, talents.
Il faut pouvoir chercher dans ces données facilement. Prévoir des composants adaptés pour la recherche.

**Steps**
1. Phase 0 - Alignement du socle et conventions: fixer les conventions de code (domain/repositories/services/ui), ajouter Pinia, définir les types stricts partagés, et corriger les incohérences UI existantes bloquantes pour Vue (ex. attributs JSX-like dans composants Vue). *bloque toutes les phases suivantes*. --> FAIT (la base supabase est en place, et les informations de connexion sont dans le .env)
2. Phase 1 - Modèle de données et sécurité Supabase: créer les tables (profiles, sessions, session_members, characters, careers, weapons, armors, equipments, character_items, notifications), index, contraintes d'unicité, timestamps, soft-delete si besoin; implémenter RLS selon rôles MJ/joueur. *dépend de 1*. ==> FAIT partiellement, on ne fera pas cette étape en SQL avec l'agent, on le fera à la main dans l'interface de supabase ==> A IGNORER
3. Phase 1 - Invitations et jointure session: implémenter memberships via `users_session` (sélection multi-utilisateurs côté MJ, sans doublon, sans retrait), jointure joueur par code session, et notification d'invitation en parallèle via `notifications`. *dépend de 2; parallèle avec 4 partiellement*.
4. Phase 2 - Auth + profil: flux inscription/connexion via Supabase Auth, profil utilisateur (username unique global + email), édition mot de passe, garde de routes. *dépend de 2*.
5. Phase 2 - Navigation et écrans de base: structurer le routeur pour les écrans demandés, ajouter guards d'accès (auth + membership `users_session`), blocage des actions d'écriture sur session archivée, et état d'application minimal Pinia (session courante, user, notifications non lues). *dépend de 4; parallèle avec 6*.
6. Phase 3 - Sessions de jeu: écran liste sessions (cartes, état actif/archivé, avatars joueurs), écran session (cartes persos résumées, actions MJ), gestion archive/désarchive/suppression selon droits MJ. Ajouter l'action MJ d'ajustement d'expérience sur le personnage (expérience totale, expérience disponible) depuis la session ou la fiche. *dépend de 3 et 5*.
7. Phase 4 - Domaine personnage Warhammer: implémenter la structure complète demandée (stats primaires/secondaires base+avance+total, carrière, compétences/talents, inventaire/armes/armures/équipements équipés, argent et conversions, encombrement, PV/fortune actuels, expérience totale, expérience disponible) et règles de calcul centralisées dans services testés. Prévoir invariant métier: l'expérience disponible ne doit pas dépasser l'expérience totale et ne doit pas être négative. *dépend de 2; interface dépend de 5*.
8. Phase 4 - Écrans personnage et édition: vue lecture/édition conditionnée par droit (propriétaire RW, MJ RO sauf exceptions métier), section rapide mobile (PV/fortune/destin/dés/expérience si retenu), section détaillée dépliable, import/export JSON du personnage. L'édition des champs d'expérience totale/disponible est autorisée au MJ; le joueur peut dépenser l'expérience disponible via les mécanismes de progression autorisés. *dépend de 7 et 6*.
9. Phase 5 - Temps réel et notifications: abonnements Supabase Realtime pour characters, sessions, notifications; notifications ciblées MJ->joueur(s); stratégie last-write-wins explicite + feedback visuel de rafraîchissement. *dépend de 6 et 8*.
10. Phase 5 - Jet de dés (modale): service de résolution des jets (score + type + difficulté + bonus BF+X), historique court par session, action MJ “dé libre” et “message à tous”. *dépend de 6 et 8*.
11. Phase 6 - Fiabilité/perf: pagination/listes, cache local léger (pas offline-first), retries réseau, états de chargement/erreur, audits accessibilité mobile. *dépend de 9*.
12. Phase 7 - QA et déploiement: unit tests domaine (règles Warhammer), tests intégration repositories/services, e2e auth/session/personnage/notifications, préparation CI GitHub et vérification déploiement Vercel. *dépend de toutes les phases*.

**Relevant files**
- /workspaces/typescript-node/src/db/supabase.ts - client Supabase à étendre (auth helpers, realtime channels).
- /workspaces/typescript-node/src/ui/router.ts - refonte routes/guards pour les écrans + autorisations.
- /workspaces/typescript-node/src/App.vue - layout global + providers (stores, toasts/notifications).
- /workspaces/typescript-node/src/ui/components/NavBar.vue - navigation selon état auth/session en cours.
- /workspaces/typescript-node/src/ui/components/Footer.vue - correction syntaxe Vue + liens produit.
- /workspaces/typescript-node/src/ui/views/HomeView.vue - accueil conditionnel connecté/non connecté.
- /workspaces/typescript-node/src/ui/views/CharacterListView.vue - pivot vers “mes personnages” multi-session.
- /workspaces/typescript-node/src/ui/views/CharacterDetailView.vue - vue lecture selon droits.
- /workspaces/typescript-node/src/repositories - accès données Supabase (à créer).
- /workspaces/typescript-node/src/services - logique métier/règles conversions/calculs (à créer).

Ces parties sont optionnelles mais fortement recommandées pour la QA et la maintenance:
- /workspaces/typescript-node/tests/unit - tests de règles métiers.
- /workspaces/typescript-node/tests/e2e - parcours critiques (auth, sessions, permissions).

**Verification**
1. Vérifier les contraintes DB: unicité username, unicité token session, FK empêchant un personnage dans plusieurs sessions. Le fichier `models.sql` est ta bible.
2. Vérifier RLS via tests d'autorisation: joueur non membre refusé, joueur membre lecture autorisée, MJ droits d'administration session. Idem, c'est dans `models.sql`.
6. Vérifier UX mobile sur écran personnage (actions rapides, section dépliable, accessibilité tactile).
7. Valider build, preview et deploy avec Vercel, voir avec moi.

**Decisions**
- Auth provider: Supabase Auth uniquement.
- Username: unique global, connexion possible email ou username.
- Visibilité sessions: privées, accessibles uniquement aux membres invités.
- Référentiels Warhammer: catalogue global versionné dans la BDD.
- Temps réel: synchro simple sans coédition avancée; stratégie last-write-wins.
- Données locales: online-first avec cache local léger, pas offline-first complet.
- Notifications: conservation 30 jours avec statut lu/non lu. Déjà dans un trigger Supabase.
- Invitations session: membership source de vérité via `users_session`; `notifications` sert d'alerte utilisateur et de suivi lu/non lu.

**Further Considerations**
1. Token 6 caractères: garder ce format pour UX; implémenter retries côté app en cas de collision d'unicité DB.
2. Suppression session/personnage: privilégier soft-delete (archivé/supprimé logiquement) pour audit et récupération, hard-delete réservé aux purges admin. ==> PAS à faire, on fera une migration avec un champ `deleted_at` et un trigger pour ne pas afficher les éléments supprimés.


