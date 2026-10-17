---
name: fix-lint
description: Fix lint, type and hook errors
disable-model-invocation: true
---
# Fix lint

## When
Slash command only.

## Rules
Apply skill `lint-typecheck-fix`. Fix all errors.

## Tools
`prek`, `eslint`, `npm run typecheck`, `read/problems`.

## Verify
prek, eslint and typecheck all pass.
