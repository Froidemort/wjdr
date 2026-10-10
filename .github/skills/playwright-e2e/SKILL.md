---
name: playwright-e2e
description: Playwright end-to-end tests. Use when writing or debugging e2e tests.
---
- Tests in `tests/e2e`; config `playwright.config.ts`.
- Deployed target: `npm run test:e2e:deploy`.
- Role/label locators; no fixed waits.
- Mock external calls; reuse auth state.
- Debug with the Playwright MCP.
