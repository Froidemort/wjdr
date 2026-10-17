---
name: supabase-data
description: Supabase queries, typing, auth, repositories. Use when reading or writing database data or handling auth.
---
# Supabase data access

## When
Reading or writing database data; handling auth.

## Rules
- Follow `.github/instructions/ts-data.instructions.md` (typing, `{ data, error }`, `getUser()`, one repository per entity).
- Client in `src/db/supabase.ts`; no server env or secrets in frontend.

## Tools
- `supabase` MCP (read-only): `list_tables`, `execute_sql` SELECT, `get_advisors`, `search_docs`.
- `context7` for `@supabase/supabase-js` docs.

## Verify
`npm run typecheck`; repository unit tests green.
