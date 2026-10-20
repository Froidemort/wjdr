---
name: daisyui-ux
description: daisyUI 5 + Tailwind 4 UI conventions. Use when building or styling components, layouts, themes, modals, forms.
---
# daisyUI + Tailwind UI

## When
Building or styling components, layouts, themes, modals, forms.

## Rules
- daisyUI classes (`btn`, `card`, `modal`, `alert`, `input`); no custom rebuilds; semantic tokens only, no hex.
- Mobile first; `sm:`/`md:`/`lg:` for enhancements. Icons from `@lucide/vue`.
- `range` is single-thumb; use two inputs for min/max.

## Tools
- `context7` for daisyUI 5 / Tailwind 4 docs (https://daisyui.com/).
- `storybook` MCP to inspect existing components and variants.
- `playwright` MCP for screenshots at mobile and desktop widths.
- Only `ui-ux-controller` and `test-writer` have `storybook` and `playwright`; other agents (e.g. `implementer`) use `context7` only and delegate visual checks to `ui-ux-controller`.

## Verify
`./node_modules/.bin/eslint .`; story renders in all states.
Visual checks (screenshots at 390px and desktop, story variants): owned by `ui-ux-controller`.
