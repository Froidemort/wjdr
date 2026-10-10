---
description: Vue SFC rules
applyTo: "src/**/*.vue"
---
- Use `<script setup lang="ts">`.
- Type `defineProps<{...}>()` and `defineEmits<{...}>()`.
- `ref()` for primitives; `reactive()` for forms only.
- Wrap store state with `storeToRefs()`.
- Use daisyUI component classes and semantic color tokens.
- Use semantic HTML tags.
- Extract reusable logic to `src/composables`; prefer VueUse.
- No data access in components; use stores or composables.
- Every new component gets a story in `src/stories`.
