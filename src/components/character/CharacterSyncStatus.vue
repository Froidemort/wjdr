<script setup lang="ts">
import { CircleCheck, CircleX, CloudOff, LoaderCircle } from '@lucide/vue'
import { computed } from 'vue'

const props = defineProps<{
  state: 'ok' | 'loading' | 'error'
  queuedCount: number
  online: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

const label = computed(() => {
  if (props.state === 'error') {
    return 'Erreur de sauvegarde'
  }
  if (props.state === 'loading') {
    return 'Enregistrement...'
  }
  if (props.queuedCount > 0) {
    return `${props.queuedCount} modification${props.queuedCount > 1 ? 's' : ''} en attente`
  }
  if (!props.online) {
    return 'Hors ligne'
  }

  return 'Enregistré'
})

const tone = computed(() => {
  if (props.state === 'error') {
    return 'text-error'
  }
  if (props.state === 'loading' || props.queuedCount > 0 || !props.online) {
    return 'text-warning'
  }

  return 'text-success'
})
</script>

<template>
  <div class="flex min-h-11 items-center justify-end gap-2 px-1 text-sm" :class="tone" data-testid="sync-status">
    <p role="status" aria-live="polite" class="flex min-w-0 items-center gap-1.5 font-medium">
      <LoaderCircle v-if="state === 'loading'" class="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      <CircleX v-else-if="state === 'error'" class="h-4 w-4 shrink-0" aria-hidden="true" />
      <CloudOff v-else-if="queuedCount > 0 || !online" class="h-4 w-4 shrink-0" aria-hidden="true" />
      <CircleCheck v-else class="h-4 w-4 shrink-0" aria-hidden="true" />
      <span class="truncate" :title="label">{{ label }}</span>
    </p>
    <button
      v-if="state === 'error'"
      type="button"
      class="btn btn-error btn-outline btn-sm min-h-11"
      :disabled="!online"
      @click="emit('retry')"
    >
      Réessayer
    </button>
  </div>
</template>
