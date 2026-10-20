---
name: e2e-auth-mock
description: Write authenticated Playwright e2e tests without a real database using the FakeBackend fixture. Use when an e2e test needs a logged-in user or mocked Supabase REST.
---
# E2E with fake Supabase

## When
E2E on auth-only routes (`/characters/:id`, `/campaigns`, `/profile`) or any test that must not hit the database.

## Fixture
`tests/e2e/fixtures/supabaseAuth.ts`
- `import { test, expect, E2E_USER_ID, E2E_CHARACTER_ID } from './fixtures/supabaseAuth'`
- `backend` fixture is `auto`: fake session injected via `sb-*-auth-token` storage, `/auth/v1/**` and `/rest/v1/**` routed to `FakeBackend`.
- `backend.offline = true` aborts auth calls (offline scenarios).
- `backend.patchesTo('<table>')` and `backend.requests` assert writes; use `expect.poll`.
- Seed data: `backend.character`, `backend.stats`, etc.; extend the class for new tables instead of per-test routes.

## Rules
- Follow `.github/instructions/tests.instructions.md` and skill `playwright-e2e`.
- Public pages without auth: plain `page.route('**/rest/v1/<table>*', ...)` like `compendium-*.spec.ts`.
- Never real credentials or `.env*`; never modify existing tests to make them pass.
- First `goto` may hit the 45s cold-vite timeout: use `waitUntil: 'domcontentloaded'`.
- Wait for `html.app-splash-active` to disappear before assertions.

## Verify
`npx playwright test tests/e2e/<file>.spec.ts`
