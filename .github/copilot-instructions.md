<!-- rtk-instructions v2 -->
# RTK
- Prefix shell commands with `rtk` (e.g. `rtk git status`).
- Meta: `rtk gain`, `rtk discover`.
<!-- /rtk-instructions -->

# wjdr

Warhammer Fantasy RPG companion. Vue 3.5, Vite 8, TypeScript, Pinia, vue-router, Tailwind 4 + daisyUI 5, Supabase, Dexie (offline), VueUse, Vercel `api/`, Vitest, Playwright, Storybook, MSW.

## Commands
- Lint: `./node_modules/.bin/eslint .` (never `npx eslint`)
- Typecheck: `npm run typecheck`
- Hooks (prek, `.pre-commit-config.yaml`): `prek run --files <files>` / `prek run --all-files`; pre-push runs unit tests
- Unit: `npm run test:unit`
- E2E: `npm run test:e2e`

## Layout
- `src/views` pages, `src/components` UI, `src/composables` logic
- `src/stores` Pinia, `src/services` repositories, `src/db` clients
- `api/` Vercel functions, `migrations/` SQL + Python, `tests/{unit,e2e}`

## Rules
- Terse replies and reports: short fragments, no filler, no pleasantries. Normal prose for code, commits, PRs, security warnings, destructive-action confirmations.
- `<script setup lang="ts">` only; no `any`.
- Data access only via `src/services/*Repository.ts`.
- Add or update tests with every behavior change.
- No secrets in code; no frontend access to server env.
- Run prek + lint + typecheck before finishing; never `--no-verify`.
- Graph: read via `graphify` MCP (may be stale; verify in source). Only `implementer` may refresh it after structural changes: `prek run graphify-update --hook-stage manual --all-files`.
- Never `git push`, force/reset git, `rm -rf`, install/remove packages, read `.env*`, or edit `.github/hooks/` without asking the user.
- Use conventional commits in English for commit messages.
- Commits: logical commits per coherent branch (`feat/...`, `chore/...`), cascaded when dependent. Never push.
- Before deleting code flagged by knip, verify no dynamic or story/test usage; delete only on proof.
- New table with serial/identity id: grant sequence usage in the same migration (see `migrations/011_grant_spells_sequence_access.sql`).
- Trivial task (1-3 files): call `implementer` or `test-writer` directly; skip orchestrator and planner.
- Subagent prompts list exact file paths; agents read only those files, no repo-wide exploration.
- Code navigation: `graphify` first (`query_graph`, `get_neighbors`), then `read_file` with line ranges; no `list_dir` sweeps. Config/route/store facts: `/memories/repo/quick-facts.md`.
- Long task: stop at a checkpoint and report instead of hitting the tool-call limit ("Continue to iterate?").

## Skills
`vue-reactive`, `daisyui-ux`, `supabase-data`, `supabase-migrations`, `pinia-dexie-offline`, `vercel-serverless`, `storybook-vitest`, `playwright-e2e`, `e2e-auth-mock`, `warhammer-domain`, `lint-typecheck-fix`, `git-cascade`, `knip-triage`, `update-quick-facts`.
Slash-only skills: `add-tests`, `fix-lint`, `new-component`, `new-migration`, `new-store`, `review-pr`.
