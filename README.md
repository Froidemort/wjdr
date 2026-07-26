# Warhammer RPG App

Companion app pour Warhammer Fantasy Roleplay 2e, construite avec Vue 3 + TypeScript + Supabase.

## Fonctionnalites

- Auth Supabase (email + username), profil et avatar
- Gestion des campagnes, sessions et notes de session
- Invitations, demandes d'acces et notifications
- Gestion des personnages et feuille rapide (stats, XP, ressources, inventaire)
- Mises a jour realtime (sessions, personnages, notifications)

## Stack

- Vue 3, TypeScript, Pinia, Vue Router
- Tailwind CSS v4, DaisyUI v5
- Supabase (Auth, Postgres, Realtime)
- Vite, Vitest, Playwright

## Prerequis

- Node.js 22+
- npm 10+
- Projet Supabase

## Variables d'environnement

Creer `.env` a la racine:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Base de donnees

Executer les scripts SQL dans l'ordre:

1. `migrations/001_rename_sessions_to_campaigns.sql`
2. `migrations/002_create_sessions_table.sql`
3. `migrations/003_update_rls_policies.sql`
4. `migrations/004_unique_campaign_code.sql`

Reference schema/data publique:

- `migrations/public_schema.sql`
- `migrations/public_data.sql`

## Developpement

```bash
npm install
npm run dev
```

## Commandes utiles

```bash
npm run typecheck
npm run lint
npm run build
npm run test:unit
npm run test:e2e
```

Smoke tests deploy:

```bash
PLAYWRIGHT_BASE_URL=https://your-preview-url.vercel.app npm run test:e2e:deploy
```

## Notes

- UI en francais
- Identifiants/structure de code en anglais
