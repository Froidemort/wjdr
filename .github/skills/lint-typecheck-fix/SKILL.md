---
name: lint-typecheck-fix
description: Run prek hooks, ESLint and vue-tsc, and fix errors. Use before finishing any change or when lint/typecheck/hooks fail.
---
# Lint, typecheck, hooks

## When
Before finishing any change; when a commit or push is rejected by prek.

## Rules
- Fix root cause; no `any`, no `@ts-ignore`, no rule disabling, no `--no-verify`.
- Never `npx eslint` (jiti error).

## Tools
- Hooks on changed files: `prek run --files <files>`; all: `prek run --all-files`.
- Pre-push stage: `prek run --all-files --hook-stage pre-push`; manual (knip): `prek run --all-files --hook-stage manual`.
- Lint: `./node_modules/.bin/eslint .`.
- Typecheck: `npm run typecheck`.
- `execute/runInTerminal`; `read/problems` for editor diagnostics.

## Verify
Repeat until prek, eslint and typecheck all pass. Auto-fix hooks (whitespace, ruff-format) rewrite files: review `git diff` after.
