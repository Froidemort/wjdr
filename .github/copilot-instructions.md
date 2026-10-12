<!-- rtk-instructions v2 -->
# RTK
- Prefix shell commands with `rtk` (e.g. `rtk git status`).
- Meta: `rtk gain`, `rtk discover`, `rtk proxy <cmd>` (raw output).
<!-- /rtk-instructions -->

# wjdr

Warhammer Fantasy RPG companion. Vue 3.5, Vite 8, TypeScript, Pinia, vue-router, Tailwind 4 + daisyUI 5, Supabase, Dexie (offline), VueUse, Vercel `api/`, Vitest, Playwright, Storybook, MSW.

## Commands
- Lint: `./node_modules/.bin/eslint .` (never `npx eslint`)
- Typecheck: `npm run typecheck`
- Unit: `npm run test:unit`
- E2E: `npm run test:e2e`

## Layout
- `src/views` pages, `src/components` UI, `src/composables` logic
- `src/stores` Pinia, `src/services` repositories, `src/db` clients
- `api/` Vercel functions, `migrations/` SQL + Python, `tests/{unit,e2e}`

## Rules
- Always apply skill `caveman`.
- `<script setup lang="ts">` only; no `any`.
- Data access only via `src/services/*Repository.ts`.
- Add or update tests with every behavior change.
- No secrets in code; no frontend access to server env.
- Run lint + typecheck before finishing.
- Use conventional commits in English for commit messages.

## Skills
`vue-reactive`, `daisyui-ux`, `supabase-data`, `supabase-migrations`, `pinia-dexie-offline`, `vercel-serverless`, `storybook-vitest`, `playwright-e2e`, `warhammer-domain`, `lint-typecheck-fix`.
