# Warhammer RPG App

Warhammer Fantasy Roleplay 2nd edition companion app built with Vue 3, DaisyUI, Pinia, Supabase, and Vercel.

The app provides collaborative session and character management with live updates and a French in-app UI.

## Current Scope

- Authentication with Supabase Auth (email and username lookup flow)
- Profile management (display identity and avatar support)
- Session management (create, list, detail, archive/unarchive)
- Session join workflow (request and invitation-style notifications)
- Character management (create, list, detail)
- Character sheet quick updates:
	- resources: PV, Fortune, Destin
	- XP tracking (total and available)
	- money tracking with automatic currency coercion
	- characteristics editing
	- skills, talents, weapons, armors, and items
- Equipment UX:
	- alphabetical listing by name
	- state-cycle badges for equipped states
	- derived stats card (BF, BE, encumbrance, armor by location)
- Realtime updates for key entities and notifications

## Tech Stack

- Vue 3 + TypeScript
- Vue Router
- Pinia
- Tailwind CSS v4 + DaisyUI v5
- Supabase (Auth, Postgres, Realtime)
- Vite
- Vitest + Playwright

## Project Structure

- src/ui/views: main pages (home, characters, sessions, notifications, profile)
- src/ui/components: reusable UI components
- src/ui/composables: reusable UI and realtime logic
- src/repositories: data access layer to Supabase
- src/stores: Pinia stores
- src/types: shared domain types
- src/db: Supabase client
- tests/unit: unit tests
- tests/e2e: end-to-end tests
- models.sql: database schema, policies, and SQL functions

## Prerequisites

- Node.js 22+
- npm 10+
- A Supabase project

## Environment Variables

Create a .env file at repository root:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Database Setup

1. Open your Supabase SQL editor.
2. Run the SQL from models.sql.
3. Verify that required tables, policies (RLS), and functions are created.

## Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Type check:

```bash
npm run typecheck
```

Production build:

```bash
npm run build
```

Local preview build:

```bash
npm run preview
```

## Testing

Run unit tests:

```bash
npm run test:unit
```

Run unit tests in watch mode:

```bash
npm run test:unit:watch
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Run deploy smoke tests against a hosted URL:

```bash
PLAYWRIGHT_BASE_URL=https://your-preview-url.vercel.app npm run test:e2e:deploy
```

Run full test suite:

```bash
npm test
```

Additional testing notes:

- docs/testing-m1.md

## Deployment

This repository is configured for Vercel deployment with:

- SPA rewrite fallback to index.html
- long cache headers for versioned static assets
- revalidation-friendly headers for manifest and service worker files

Configuration file:

- vercel.json

## Security and Access Model

- Supabase Auth for identity
- Row-Level Security in database policies
- Repository-based data access with typed domain models
- Route-level authentication guards in the frontend router

## Notes

- User-facing UI strings are intentionally in French.
- Documentation and code identifiers are maintained in English.
