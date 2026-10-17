---
name: playwright-e2e
description: Playwright end-to-end tests. Use when writing or debugging e2e tests.
---
# Playwright e2e

## When
Writing or debugging e2e tests.

## Rules
- Follow `.github/instructions/tests.instructions.md`.
- Tests in `tests/e2e`; config `playwright.config.ts`; mock external calls; reuse auth state.

## Tools
- `playwright` MCP: navigate, snapshot, console and network inspection to debug and pick locators.
- `context7` for Playwright docs.

## Verify
`npm run test:e2e`; deployed target: `npm run test:e2e:deploy`.
