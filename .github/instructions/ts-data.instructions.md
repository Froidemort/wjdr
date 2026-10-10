---
description: Services, stores, db, composables rules
applyTo: "src/{services,stores,db,composables}/**/*.ts"
---
- Pinia setup-store syntax: `defineStore('id', () => {...})`.
- One repository per entity: `src/services/<name>Repository.ts`.
- Type rows with `Database['public']['Tables'][T]['Row'|'Insert']`.
- Destructure `{ data, error }`; `if (error) throw error;` immediately.
- Identity via `supabase.auth.getUser()`, never `getSession()`.
- Offline writes go through the Dexie queue; reads fall back to Dexie.
- Composables: name `useX`, return refs, no side effects at import.
- Named exports only.
