<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    current: number
    max?: number
    editable?: boolean
    maxEditable?: boolean
    highlighted?: boolean
    prominentMax?: boolean
    icon: Component
    iconClass: string
    currentAriaLabel: string
    maxAriaLabel?: string
  }>(),
  {
    editable: false,
    maxEditable: true,
    highlighted: false,
    prominentMax: false,
  }
)

const emit = defineEmits<{
  (event: 'update:current', value: number): void
  (event: 'update:max', value: number): void
}>()

const hasMax = computed(() => typeof props.max === 'number')

function toNonNegativeInteger(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function onCurrentInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:current', toNonNegativeInteger(target.value))
}

function onMaxInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:max', toNonNegativeInteger(target.value))
}
</script>

<template>
  <article
    class="card min-w-0 border bg-base-100"
    :class="highlighted ? 'border-2 border-primary/50 shadow-sm' : 'border-base-300'"
  >
    <div class="card-body gap-2 p-3 sm:gap-3 sm:p-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <div class="tooltip inline-flex shrink-0" :data-tip="label">
            <component :is="icon" :class="iconClass" aria-hidden="true" />
          </div>
          <p class="truncate text-sm font-semibold leading-tight text-base-content/85 sm:text-base">{{ label }}</p>
        </div>

        <div class="flex min-w-0 items-center justify-end gap-1.5 font-semibold tabular-nums sm:gap-2">
          <template v-if="editable">
            <input
              :value="current"
              type="number"
              min="0"
              inputmode="numeric"
              class="input input-xs h-10 w-14 text-center text-base font-bold [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:input-sm sm:w-16 sm:text-lg"
              :aria-label="currentAriaLabel"
              @change="onCurrentInput"
            />
            <span v-if="hasMax" class="text-base opacity-60 sm:text-lg">/</span>
            <input
              v-if="hasMax && maxEditable"
              :value="max"
              type="number"
              min="0"
              inputmode="numeric"
              class="input input-xs h-10 w-14 text-center text-base font-bold [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:input-sm sm:w-16 sm:text-lg"
              :aria-label="maxAriaLabel || label"
              @change="onMaxInput"
            />
            <span v-else-if="hasMax" class="text-base font-bold sm:text-lg">{{ max }}</span>
          </template>

          <template v-else>
            <span
              class="font-black leading-none"
              :class="highlighted ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl'"
            >{{ current }}</span>
            <span v-if="hasMax" class="text-base opacity-50 sm:text-xl">/</span>
            <span
              v-if="hasMax"
              class="font-bold leading-none opacity-80"
              :class="prominentMax ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'"
            >{{ max }}</span>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>