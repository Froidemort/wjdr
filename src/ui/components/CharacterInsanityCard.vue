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
    <div class="card-body p-4">
      <div class="flex items-center justify-between">
        <div class="tooltip" data-tip="Points de folie">
          <Hospital class="h-6 w-6 text-warning" aria-hidden="true" />
        </div>
        <div class="flex items-center gap-2 font-semibold tabular-nums">
        <template v-if="editable">
          <input
            :value="current"
            type="number"
            min="0"
            class="input input-sm h-10 w-20 text-center text-xl font-bold text-warning [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="Points de folie"
            @change="onCurrentInput"
          />
        </template>
        <template v-else>
          <span class="text-4xl font-black leading-none text-warning">{{ current }}</span>
        </template>
        </div>
      </div>
    </div>
  </article>
</template>