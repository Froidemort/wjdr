<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue'
import { ArrowRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'

defineProps<{
  label: string
  title: string
  description?: string
  to: string
  icon: LucideIcon
}>()
</script>

<template>
  <li class="min-w-0">
    <RouterLink
      :to="to"
      class="group flex min-h-16 items-center gap-3 rounded-box border border-base-content/10 bg-base-200/80 px-4 py-3 outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/35"
    >
      <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <component :is="icon" class="size-5" aria-hidden="true" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-xs font-semibold uppercase tracking-[0.16em] text-base-content/70">{{ label }}</span>
        <span class="block truncate font-semibold">{{ title }}</span>
        <span v-if="description" class="block truncate text-sm text-base-content/70">{{ description }}</span>
      </span>
      <ArrowRight
        class="size-4 shrink-0 text-base-content/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none"
        aria-hidden="true"
      />
    </RouterLink>
  </li>
</template>
