---
name: supabase-migrations
description: SQL migrations, RLS policies, schema changes, type regeneration. Use when changing the database schema.
---
- Add `migrations/NNN_<name>.sql` with next number.
- Enable RLS and write policies for each new table.
- Idempotent statements.
- Never edit applied migrations.
- Verify schema with the Supabase MCP (read-only).
- Regenerate types after applying.
