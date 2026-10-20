---
name: knip-triage
description: Triage knip findings (unused files, exports, dependencies) with proof of non-use before deleting. Use when fixing knip output or cleaning dead code.
---
# Knip triage
Use knip to identify unused files, exports, and dependencies before attempting deletion.
Delete only with proof; unsure means keep and report. Never remove or install packages without asking.
Prefer fixing `knip.json` (entry/ignore) over deleting real entry points.

Per item: grep `src`, `tests`, `api`, stories, `migrations`; check dynamic imports and `import.meta.glob`;
check Vite/Vitest/Playwright/Vercel configs and npm scripts; for dependencies check plugin and addon use.
Then re-run `npm run knip`, `npm run typecheck`, `npm run test:unit`.
Report: table item / verdict / evidence; list unsure items.
