---
name: lint-typecheck-fix
description: Run and fix ESLint and vue-tsc errors. Use before finishing any change or when lint/typecheck fails.
---
- Lint: `./node_modules/.bin/eslint .` (never `npx eslint`: jiti error).
- If rtk hides eslint output: `rtk proxy ./node_modules/.bin/eslint .`.
- Typecheck: `npm run typecheck`.
- Fix root cause; no `any`, no `@ts-ignore`, no rule disabling.
- Repeat until both pass.
