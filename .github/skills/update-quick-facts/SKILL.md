---
name: update-quick-facts
description: Update /memories/repo/quick-facts.md after structural changes (routes, stores, repositories, scripts, test config, auth store API). Use at the end of an implementation that touched them.
---
# Update quick-facts

## When
Change adds, renames or removes: a route, a store or its public API, a `*Repository.ts`, a `package.json` script, a vitest/playwright project, a shared type file.
Skip for logic-only edits.

## Steps
1. Map changed files to sections below; touch only those.
2. Verify each fact in source (grep/range read); never copy from memory.
3. Edit with `str_replace` on the affected lines; do not rewrite the file.
4. Keep file under ~60 lines.

## Sections and sources
| Section | Source |
|---|---|
| Scripts | `package.json` scripts |
| Test config | `vitest.config.ts`, `playwright.config.ts` |
| Router | `src/router/routes.ts` (path, meta) |
| Auth store | `src/stores/auth.ts` return block |
| Data layer | `src/services/*Repository.ts`, `src/stores/*.ts`, `src/db/` |
| Conventions | `src/types/`, `src/layouts/`, theme file |

## Format
- One line per fact, fragments, no prose.
- Lists: `name, name, name`; routes: `path[:param]` + meta keys once.
- Signatures only (`signIn(identifier, pwd)`); no bodies, no line numbers except "read ranges" hints.
- No secrets, no env values, no copied code.

## Report
`quick-facts: <sections updated>` or `quick-facts: unchanged`.
