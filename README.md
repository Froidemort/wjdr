# Warhammer RPG App

Warhammer Fantasy Roleplay 2nd edition companion app built with Vue 3, TypeScript, DaisyUI, Pinia, and Supabase.

The app focuses on collaborative session and character management with realtime updates and a French in-app UI.

## Features

- Supabase authentication with email and username lookup flow
- Profile page with identity and avatar management
- Session lifecycle: create, list, detail, archive/unarchive
- Session join flow with request and invitation notifications
- Character lifecycle: create, list, detail
- Character sheet quick updates:
  - resources (PV, Fortune, Destin)
  - XP (total and available)
  - money with automatic currency coercion
  - characteristics, skills, talents, weapons, armors, and items
- Equipment UX:
  - alphabetical ordering by item name
  - state-cycle badges for equipped states
  - derived stats (BF, BE, encumbrance, armor by location)
- Realtime updates for sessions, characters, and notifications

## Tech Stack

- Vue 3 + TypeScript
- Vue Router + Pinia
- Tailwind CSS v4 + DaisyUI v5
- Supabase (Auth, Postgres, Realtime)
- Vite
- Vitest + Playwright

## Project Map

- [src/ui/views](src/ui/views): route-level pages
- [src/ui/components](src/ui/components): reusable UI components
- [src/ui/composables](src/ui/composables): reusable UI/realtime hooks
- [src/repositories](src/repositories): Supabase data access layer
- [src/stores](src/stores): Pinia stores
- [src/types](src/types): shared domain and DB types
- [src/db](src/db): Supabase client bootstrap
- [src/services](src/services): pure service logic (example: dice)
- [src/utils](src/utils): shared helpers and validation
- [tests/unit](tests/unit): unit tests
- [tests/e2e](tests/e2e): Playwright end-to-end tests
- [docs/testing-m1.md](docs/testing-m1.md): additional testing notes and scenarios
- [models.sql](models.sql): schema, RLS policies, and SQL functions

## Prerequisites

- Node.js 22+
- npm 10+
- A Supabase project

## Environment Variables

Create a `.env` file at repository root:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Database Setup

1. Open Supabase SQL Editor.
2. Run [models.sql](models.sql).
3. Confirm tables, RLS policies, and SQL functions are created.

**NOTE :** not all the RLS, functions, grants are defined in this file.

## Development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run typecheck
npm run lint
npm run build
npm run preview
```

## Testing

```bash
npm run test:unit
npm run test:unit:watch
npm run test:e2e
npm test
```

Deploy smoke tests:

```bash
PLAYWRIGHT_BASE_URL=https://your-preview-url.vercel.app npm run test:e2e:deploy
```

See [docs/testing-m1.md](docs/testing-m1.md) for detailed testing notes.

## Deployment

Deployment is configured for Vercel. See [vercel.json](vercel.json).

## Security

- Supabase Auth for identity
- Row-Level Security (RLS) in Postgres policies
- Repository-based typed data access
- Route-level auth guards in the frontend router

## Notes

- User-facing UI strings are in French.
- Code identifiers and documentation are in English.
