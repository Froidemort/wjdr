<script setup lang="ts">
import { computed } from 'vue'
import { Heart, Clover, WandSparkles } from '@lucide/vue'

const props = withDefaults(defineProps<{
  label: string
  current: number
  max: number
  icon: 'heart' | 'clover' | 'wand-sparkles'
  editable?: boolean
}>(), {
  editable: false
})

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
  <article class="card border border-base-300 bg-base-100">
    <div class="card-body p-4 gap-4">
      <div class="flex items-center justify-between">
        <div class="tooltip" :data-tip="label">
          <component :is="iconComponent" :class="iconClass" />
        </div>
        <div class="flex items-center gap-2 font-semibold tabular-nums">
          <template v-if="editable">
            <input
              :value="current"
              type="number"
              min="0"
              class="input input-sm h-10 w-20 text-center text-xl font-bold [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Valeur courante"
              @input="onCurrentInput"
            />
            <span class="text-lg opacity-60">/</span>
            <input
              :value="max"
              type="number"
              min="0"
              class="input input-sm h-10 w-20 text-center text-xl font-bold [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Valeur maximale"
              @input="onMaxInput"
            />
          </template>
          <template v-else>
            <span class="text-4xl font-black leading-none">{{ current }}</span>
            <span class="text-xl opacity-50">/</span>
            <span class="text-3xl font-bold leading-none opacity-80">{{ max }}</span>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>
