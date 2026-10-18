<script setup lang="ts">
import { useDeviceBreakpoint } from '../../composables/useDeviceBreakpoint'

defineProps<{
  title: string
  /** Mobile only: start collapsed. */
  collapsed?: boolean
}>()

const { isMobile } = useDeviceBreakpoint()
</script>

<template>
  <details v-if="isMobile" class="collapse collapse-arrow rounded-box border border-base-300 bg-base-100" :open="!collapsed">
    <summary class="collapse-title min-h-11 text-lg font-semibold">{{ title }}</summary>
    <div class="collapse-content space-y-3">
      <slot />
    </div>
  </details>
  <section v-else class="space-y-3">
    <h3 class="text-lg font-semibold">{{ title }}</h3>
    <slot />
  </section>
</template>
