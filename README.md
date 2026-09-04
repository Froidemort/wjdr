# Warhammer RPG App

Companion app pour le jeu de rôle Warhammer seconde édition, construite avec Vue 3 TS + DaisyUI/Tailwind4 + Supabase.

## Fonctionnalités

- Auth Supabase (email + username), profil et avatar
- Gestion des campagnes, sessions et notes de session
- Invitations, demandes d'accès et notifications
- Gestion des personnages et feuille rapide (stats, XP, ressources, inventaire)
- Mises à jour realtime (sessions, personnages, notifications)

## Stack

- Vue 3 et TypeScript
- Pinia
- Vue-core, Vue-router, ...
- Tailwind CSS v4, DaisyUI v5
- Supabase (Auth, Postgres, Realtime)
- Vite, Vitest, Playwright

## Prérequis

- Node.js 22+
- npm 10+
- Projet Supabase

## Variables d'environnement

Pour le développement, créer un fichier `.env` à la racine:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY # ou VITE_SUPABASE_PUBLISHABLE_KEY
```

## Base de données

Référence schema/data publique pour initialiser la base de données :

- `migrations/public_schema.sql` : schéma initial
- `migrations/public_data.sql` : données initiales du livre de règles

Exécuter les scripts SQL `migrations/*.sql` des différentes migrations

⚠️ Les scripts de migration n'ont pas toutes les instructions à jour, notamment pour les GRANT et les RLS ⚠️.

Il existe également des resources à extraire de PDF via des scripts python.
⚠️ Actuellement l'environnement python n'est pas défini ⚠️

Il faut utiliser les scripts `career_paths_extractor.py` pour les carrières et les liens de carrières, `skills_talents.py` pour les liens entre les talents et les compétences, `weapon_attributes.py` pour les liens entres les armes des les attributs des armes.

Ces scripts sont perfectibles, et fonctionnent avec les PDFs `migrations/compendium_carrieres_modifie.pdf` et `migrations/compendium_skills_talents.pdf` qui proviennent du forum (Warhammer)[https://www.warhammer-forum.com/topic/270712-compendium-divers-wjdr-v2/], grâce au travail d'un certain *Balian de Troy* que je remercie.

## Développement

```bash
npm install
npm run dev
```

Pour la récupération de mot de passe, ajouter l'URL `https://VOTRE_DOMAINE/reset-password` dans les Redirect URLs de Supabase Auth. En développement, ajouter aussi l'URL locale correspondante, par exemple `http://localhost:5173/reset-password`.

## Commandes utiles

```bash
npm run typecheck # typescript
npm run lint # linter eslint
npm run build # 🚀 build l'application
npm run test:unit # tests unitaires
npm run test:e2e # ⚠️ nécessite playwright
```

## Storybook

Il est possible d'utiliser [StoryBook](https://storybook.js.org/) pour tester les composants vue. A voir dans `src/stories`.

La commande utile est `npm run storybook`.

## Notes

- UI en français
- Identifiants/structure de code en anglais
