---
description: Test and story rules
applyTo: "tests/**,**/*.test.ts,**/*.stories.ts"
---
- Unit: Vitest in `tests/unit`, named `<subject>.test.ts`.
- Mock network with MSW; IndexedDB with `fake-indexeddb`; stores with `@pinia/testing`.
- E2E: Playwright in `tests/e2e`; use role/label locators.
- No `sleep`; use auto-waiting and `expect.poll`.
- One behavior per test; no shared mutable state.
- Run a single file: `npx vitest run --project unit <file>`.
