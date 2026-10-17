---
name: vue-reactive
description: Vue 3 reactivity, Pinia stores, props/emits typing. Use when writing or editing Vue components, composables, or Pinia stores.
---
# Vue 3 + Pinia

## When
Writing or editing Vue components, composables, Pinia stores.

## Rules
- Follow `.github/instructions/vue.instructions.md` and `ts-data.instructions.md`.
- Omit generics when inferred; no `any`.

## Tools
- `context7` for Vue, Pinia, VueUse, vue-router docs.
- `graphify` (`get_neighbors`) to find components and stores depending on a composable or store.

## Verify
`npm run typecheck`; `./node_modules/.bin/eslint .`.
