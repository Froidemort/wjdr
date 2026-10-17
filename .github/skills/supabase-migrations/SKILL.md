---
name: supabase-migrations
description: SQL migrations, RLS policies, schema changes, type regeneration. Use when changing the database schema.
---
# Supabase migrations

## When
Changing the database schema.

## Rules
- Follow `.github/instructions/sql.instructions.md`.
- Never apply migrations yourself: the user applies them; then regenerate types and update repositories.

## Tools
- `supabase` MCP (read-only): `list_tables`, `list_migrations`, `execute_sql` SELECT, `get_advisors` (security), `generate_typescript_types`.
- Python helper scripts in `migrations/` follow `python.instructions.md`.

## Verify
`prek run --files <files>`; advisors clean; regenerate types after the user applies the migration; update affected repositories.
