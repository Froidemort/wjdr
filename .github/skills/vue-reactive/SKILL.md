# Skill: vue-reactive

## Constraints
- Syntax: Strictly use `<script setup lang="ts">`.
- State: `ref()` for primitives, `reactive()` only for complex objects/forms.
- Pinia: Setup store syntax (`defineStore('id', () => { ... })`).
- Destructuring: Always wrap state with `storeToRefs()` to preserve reactivity.
- Strict Typing: Explicit TS types for `defineProps<{...}>()` and `defineEmits<{...}>()`.

## Output Style
Return clean TypeScript code, omitting optional generic definitions if inferred correctly.