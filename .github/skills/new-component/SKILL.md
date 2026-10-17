---
name: new-component
description: Scaffold a Vue component with story and test
argument-hint: Component name
disable-model-invocation: true
---
# New component

## When
Slash command only. Name = text after the command; ask if missing.

## Rules
- Create in `src/components`; apply skills `vue-reactive`, `daisyui-ux`, `storybook-vitest`.
- Add story and unit test.

## Tools
- `graphify` (`get_community`) to place it next to related components.
- `storybook` MCP to check sibling stories.

## Verify
`prek run --files <files>`; `npm run typecheck`; tests green.
