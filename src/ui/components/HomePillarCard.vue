<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  numeral: string
  title: string
  description: string
  icon: Component
}>()
</script>

<template>
  <li class="flex items-start gap-4 py-4">
    <div
      class="flex size-9 shrink-0 items-center justify-center rounded-box border border-primary/20 bg-primary/10 text-primary"
      aria-hidden="true"
    >
      <component :is="icon" class="size-4" />
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="font-[family-name:var(--font-grim-title)] text-base tracking-wide">{{ title }}</h3>
      <p class="mt-0.5 text-sm leading-relaxed text-base-content/70">{{ description }}</p>
    </div>
    <span
      class="shrink-0 font-[family-name:var(--font-grim-title)] text-sm text-primary/35"
      aria-hidden="true"
    >
      {{ numeral }}
    </span>
  </li>
</template>
