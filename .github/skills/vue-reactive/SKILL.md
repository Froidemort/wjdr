---
name: vue-reactive
description: Vue 3 reactivity, Pinia stores, props/emits typing. Use when writing or editing Vue components, composables, or Pinia stores.
---
- `<script setup lang="ts">` only.
- `ref()` for primitives; `reactive()` for complex objects/forms.
- Pinia setup syntax: `defineStore('id', () => {...})`.
- Wrap store state with `storeToRefs()`.
- Type `defineProps<{...}>()` and `defineEmits<{...}>()`.
- Omit generics when inferred.
