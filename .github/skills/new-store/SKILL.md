---
name: new-store
description: Scaffold a Pinia store with repository and tests
argument-hint: Store name
disable-model-invocation: true
---
# New store

## When
Slash command only. Name = text after the command; ask if missing.

## Rules
- Store in `src/stores`, repository in `src/services`.
- Apply skills `vue-reactive`, `supabase-data`, `pinia-dexie-offline`.
- Add unit tests.

## Tools
`graphify` (`query_graph`) for similar stores; `supabase` MCP (read-only) for table shape.

## Verify
`prek run --files <files>`; `npm run typecheck`; `npm run test:unit`.
