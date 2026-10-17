---
name: new-migration
description: Write a SQL migration
argument-hint: Schema change description
disable-model-invocation: true
---
# New migration

## When
Slash command only. Change = text after the command; ask if missing.

## Rules
- Apply skill `supabase-migrations`.
- Update affected types and repositories.

## Tools
`supabase` MCP (read-only) to inspect current schema and advisors; `graphify` (`get_neighbors`) for dependent repositories.

## Verify
`prek run --files <files>`; `npm run typecheck`.
