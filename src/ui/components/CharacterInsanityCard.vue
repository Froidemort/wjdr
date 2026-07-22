<script setup lang="ts">
import { Hospital } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    current: number
    editable?: boolean
  }>(),
  {
    editable: false,
  }
)

const emit = defineEmits<(event: 'update:current', value: number) => void>()

function onCurrentInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:current', Math.max(0, Number(target.value || 0)))
}
</script>

<template>
  <article class="card border border-base-300 bg-base-100 shadow-sm min-w-0">
    <div class="card-body p-3 sm:p-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <div class="tooltip inline-flex shrink-0" data-tip="Points de folie">
            <Hospital class="h-6 w-6 text-warning" aria-hidden="true" />
          </div>
          <p class="truncate text-sm sm:text-base font-semibold leading-tight text-base-content/85">
            Points de folie
          </p>
        </div>
        <div class="flex min-w-0 items-center justify-end gap-2 font-semibold tabular-nums">
        <template v-if="editable">
          <input
            :value="current"
            type="number"
            min="0"
            inputmode="numeric"
            class="input input-xs sm:input-sm h-10 w-14 sm:w-16 text-center text-base sm:text-lg font-bold text-warning [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="Points de folie"
            @change="onCurrentInput"
          />
        </template>
        <template v-else>
          <span class="text-2xl sm:text-4xl font-black leading-none text-warning">{{ current }}</span>
        </template>
        </div>
      </div>
    </div>
  </article>
</template>