---
name: warhammer-domain
description: Warhammer Fantasy Roleplay domain rules and vocabulary. Use when modeling characters, careers, skills, talents, spells, equipment, dice.
---
# Warhammer domain

## When
Modeling characters, careers, skills, talents, spells, equipment, dice.

## Rules
- Types in `src/types` (`career`, `character`, `equipment`, `catalog`, `domain`).
- Dice logic in `src/services/dice.ts`.
- Equipment slots in `src/utils/equipmentSlots.ts`.
- User-facing text French; code and identifiers English.

## Tools
- `graphify` (`query_graph`, `get_community`) to locate domain modules.
- `supabase` MCP (read-only) to inspect compendium tables.

## Verify
`npm run typecheck`; `npm run test:unit`.
