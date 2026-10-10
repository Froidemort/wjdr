---
name: supabase-data
description: Supabase queries, typing, auth, repositories. Use when reading or writing database data or handling auth.
---
- Type with `Database['public']['Tables'][T]['Row'|'Insert']`.
- `const { data, error } = await supabase...`; `if (error) throw error;`.
- `supabase.auth.getUser()`, never `getSession()`.
- Queries live in `src/services/*Repository.ts`.
- Client in `src/db/supabase.ts`.
