<script setup lang="ts">
import { Hospital } from '@lucide/vue'

const props = withDefaults(defineProps<{
  current: number
  editable?: boolean
}>(), {
  editable: false
})

const emit = defineEmits<{
  (event: 'update:current', value: number): void
}>()

function onCurrentInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:current', Math.max(0, Number(target.value || 0)))
}
</script>

<template>
  <article class="card border border-base-300 bg-base-100 shadow-sm">
    <div class="card-body gap-4 p-4 items-center">
      <div class="flex items-center justify-between">
        <div class="tooltip" data-tip="Points de folie">
          <Hospital class="h-6 w-6 text-violet-400" aria-hidden="true" />
        </div>
      </div>

        <template v-if="editable">
          <input
            :value="current"
            type="number"
            min="0"
            class="input input-sm text-align-center h-12 w-1/4 border-violet-500/30 bg-base-100/20 text-center text-2xl font-black text-violet-300 [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="Points de folie"
            @input="onCurrentInput"
          />
        </template>
        <template v-else>
          <div class="text-5xl font-black leading-none text-violet-300">{{ current }}</div>
        </template>
    </div>
  </article>
</template>