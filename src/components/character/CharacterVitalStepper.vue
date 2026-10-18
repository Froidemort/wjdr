<script setup lang="ts">
import { Minus, Plus } from '@lucide/vue'

const props = defineProps<{
  label: string
  value: number
  max: number
  editable: boolean
  toneClass?: string
}>()

const emit = defineEmits<{
  'update:value': [value: number]
}>()

function step(delta: number): void {
  const next = Math.min(Math.max(0, props.max), Math.max(0, props.value + delta))
  if (next !== props.value) {
    emit('update:value', next)
  }
}
</script>

<template>
  <div class="min-w-0 rounded-box border border-base-300 bg-base-100 px-1.5 py-1 text-center">
    <p class="truncate text-[11px] font-semibold uppercase tracking-wide opacity-70">{{ label }}</p>
    <div class="flex items-center justify-between gap-1">
      <button
        v-if="editable"
        type="button"
        class="btn btn-ghost btn-circle btn-xs min-h-11 min-w-11"
        :aria-label="`Diminuer ${label}`"
        :disabled="value <= 0"
        @click="step(-1)"
      >
        <Minus class="h-4 w-4" />
      </button>
      <p class="flex-1 text-lg font-black tabular-nums" :class="toneClass" :aria-label="`${label} ${value} sur ${max}`">
        {{ value }}<span class="text-sm font-bold opacity-70">/{{ max }}</span>
      </p>
      <button
        v-if="editable"
        type="button"
        class="btn btn-ghost btn-circle btn-xs min-h-11 min-w-11"
        :aria-label="`Augmenter ${label}`"
        :disabled="value >= max"
        @click="step(1)"
      >
        <Plus class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
