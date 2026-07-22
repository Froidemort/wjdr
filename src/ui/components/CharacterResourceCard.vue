<script setup lang="ts">
import { Clover, Heart, WandSparkles } from '@lucide/vue'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    current: number
    max: number
    icon: 'heart' | 'clover' | 'wand-sparkles'
    editable?: boolean
  }>(),
  {
    editable: false,
  }
)

const emit = defineEmits<{
  (event: 'update:current', value: number): void
  (event: 'update:max', value: number): void
}>()

const iconComponent = computed(() => {
  if (props.icon === 'heart') {
    return Heart
  }
  if (props.icon === 'clover') {
    return Clover
  }
  return WandSparkles
})

const iconClass = computed(() => {
  if (props.icon === 'heart') {
    return 'h-6 w-6 text-error'
  }
  if (props.icon === 'clover') {
    return 'h-6 w-6 text-success'
  }
  return 'h-6 w-6 text-accent'
})

function onCurrentInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:current', Math.max(0, Number(target.value || 0)))
}

function onMaxInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:max', Math.max(0, Number(target.value || 0)))
}
</script>

<template>
  <article class="card border border-base-300 bg-base-100 min-w-0">
    <div class="card-body p-3 sm:p-4 gap-2 sm:gap-3">
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <div class="tooltip inline-flex shrink-0" :data-tip="label">
            <component :is="iconComponent" :class="iconClass" />
          </div>
          <p class="truncate text-sm sm:text-base font-semibold leading-tight text-base-content/85">{{ label }}</p>
        </div>
        <div class="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2 font-semibold tabular-nums">
          <template v-if="editable">
            <input
              :value="current"
              type="number"
              min="0"
              inputmode="numeric"
              class="input input-xs sm:input-sm h-10 w-14 sm:w-16 text-center text-base sm:text-lg font-bold [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Valeur courante"
              @change="onCurrentInput"
            />
            <span class="text-base sm:text-lg opacity-60">/</span>
            <input
              :value="max"
              type="number"
              min="0"
              inputmode="numeric"
              class="input input-xs sm:input-sm h-10 w-14 sm:w-16 text-center text-base sm:text-lg font-bold [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Valeur maximale"
              @change="onMaxInput"
            />
          </template>
          <template v-else>
            <span class="text-2xl sm:text-4xl font-black leading-none">{{ current }}</span>
            <span class="text-base sm:text-xl opacity-50">/</span>
            <span class="text-xl sm:text-3xl font-bold leading-none opacity-80">{{ max }}</span>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>
