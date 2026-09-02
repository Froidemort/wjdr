# Stack and general instructions

Full-Stack TS. Stack: Vue 3, DaisyUI, Pinia, Supabase, Vercel.
Style: Code-first, minimal prose, strict TypeScript. No conversational filler.
Code only, no explanation.
Bullet over paragraphs.
No explanations unless explicitly requested.

## Git rules

* commits in english, use conventional commit format **only**.
* branches: `main`, `dev`, `feature/*`, `fix/*`, `refactor/*`, `chore/*`.

## Code rules

* TypeScript only, no JS.
* Use `async/await` for all async code.
* Use `null` instead of `undefined` for optional values.
* Use `camelCase` for all variables, functions, and properties.
* Use `PascalCase` for all types, interfaces, and classes.
* Use component composition API over options API. Mutualize functionnalities in composables. * * Use Pinia for state management.
* Use lazy import for all components and composables, whenever possible.

## UI/UX rules

* Mobile-first design, responsive layout, and fluid typography. Use only colors from the Tailwind palette declared as DaisyUI theme in `src/assets/css/theme.css`.
* Use DaisyUI components for all UI elements.
* Use Tailwind for layout and spacing.
* ***Respect** accessibility standards (ARIA, contrast, keyboard navigation).
* **Respect** the UX rules (Jakob's Law, Fitts's Law, Hick's Law, Miller's Law, Pareto Principle, Tesler's Law, Von Restorff Effect, Nielsen's Heuristics, Serial position effect).

## Declared Skills
The following skills are available in `.github/skills/` and must be activated dynamically based on file context or explicit prompt flags:

- `vue-reactive`: Rules for Vue 3 components, Composition API, and Pinia stores.
- `daisyui-ux`: Rules for Tailwind CSS and DaisyUI component structure.
- `supabase-data`: Rules for Supabase client, auth, types, and database queries.
- `vercel-serverless`: Rules for Vercel Edge/Serverless functions in `api/`.

## Restrictions :

## Restrictions (Copilot agent)

**FORBIDDEN (Copilot agent)**: modify db files (`*.sql`, `*.prisma`, `*.supabase`), or any files in `migrations/`, unless explicitly requested by a human.

Avoid modifying:
  - .gitignore
  - .github/copilot-instructions.md

<!-- rtk-instructions v2 -->
# RTK — Token-Optimized CLI

**ALWAYS** use `rtk` to prefix shell commands in your prompts, even in "&&" commands.
**rtk** is a CLI proxy that filters and compresses command outputs, saving 60-90% tokens.

## Rule

Always prefix shell commands with `rtk`:

```bash
# Instead of:              Use:
git status                 rtk git status
git log -10                rtk git log -10
cargo test                 rtk cargo test
docker ps                  rtk docker ps
kubectl get pods           rtk kubectl get pods
```

## Meta commands (use directly)

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```
<!-- /rtk-instructions -->