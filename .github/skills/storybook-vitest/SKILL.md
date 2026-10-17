---
name: storybook-vitest
description: Storybook 10 stories and Vitest component tests. Use when adding stories or component tests.
---
# Storybook + Vitest

## When
Adding stories or component tests.

## Rules
- Follow `.github/instructions/tests.instructions.md`.
- Stories in `src/stories/<Name>.stories.ts`; mock APIs with `msw-storybook-addon`.
- Cover default, empty, loading, error states; keep a11y addon clean.

## Tools
- `storybook` MCP: list stories, inspect component docs and props.
- `context7` for Storybook 10 / Vitest docs.
- `execute/runTests` for unit runs.

## Verify
`npm run test:storybook`; `npm run test:unit`.
