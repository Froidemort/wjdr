<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    modelValue: number
    maxPoints?: number
    maxPointsEditable?: boolean
    editable?: boolean
    variant?: 'fortune' | 'destin'
    ariaLabelPrefix?: string
    iconPath?: string
    iconViewBox?: string
  }>(),
  {
    modelValue: 0,
    maxPoints: 4,
    maxPointsEditable: false,
    editable: true,
    variant: 'fortune',
    ariaLabelPrefix: 'Point',
    iconPath:
      'M12 11.2c-1.7-2.9-5-4-7.5-2.5S2.8 13 4.5 15.3c1.7 2.3 5.2 2.6 7.3 1.2-1.4 2.1-1.1 5.6 1.2 7.3 2.3 1.7 5.6 1.2 7.1-1.3 1.5-2.5.4-5.8-2.5-7.3 2.9-1.5 4-4.8 2.5-7.1-1.5-2.3-4.8-2.6-7.1-1.1-2.3 1.5-2.6 5-1.2 7.1z',
    iconViewBox: '0 0 32 32',
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void
  (event: 'update:maxPoints', value: number): void
}>()

const resolvedMaxPoints = computed(() => Math.max(0, Math.floor(props.maxPoints ?? 0)))

const resolvedPoints = computed(() =>
  Math.min(resolvedMaxPoints.value, Math.max(0, Math.floor(props.modelValue)))
)

const activeTokenClass = computed(() =>
  props.variant === 'destin'
    ? 'text-warning fill-warning drop-shadow-sm'
    : 'text-success fill-success'
)

const tokenGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.max(1, resolvedMaxPoints.value)}, minmax(0, 1fr))`,
}))

function updatePoints(value: number): void {
  const sanitized = Math.min(
    resolvedMaxPoints.value,
    Math.max(0, Math.floor(Number(value) || 0))
  )

  if (sanitized !== props.modelValue) {
    emit('update:modelValue', sanitized)
  }
}

function onMaxPointsInput(event: Event): void {
  if (!props.editable || !props.maxPointsEditable) {
    return
  }

  const target = event.target as HTMLInputElement
  const sanitized = Math.max(0, Math.floor(Number(target.value) || 0))
  emit('update:maxPoints', sanitized)
}

function setPoints(index: number): void {
  if (!props.editable) {
    return
  }

  if (resolvedPoints.value === index) {
    updatePoints(index - 1)
    return
  }

  updatePoints(index)
}
</script>

<template>
  <article class="card border border-base-300 bg-base-100 min-w-0 h-full">
    <div class="card-body h-full gap-3 p-3 sm:gap-4 sm:p-4 md:min-h-64">
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-semibold leading-tight text-base-content/85 sm:text-base">{{ label }}</p>
        <div class="flex items-center gap-1.5 text-base font-semibold tabular-nums text-base-content/80 sm:text-lg">
          <span>{{ resolvedPoints }}</span>
          <span>/</span>
          <input
            v-if="editable && maxPointsEditable"
            :value="resolvedMaxPoints"
            type="number"
            min="0"
            inputmode="numeric"
            class="input input-xs h-9 w-14 text-center text-base font-bold [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:h-10 sm:w-16 sm:text-lg"
            :aria-label="`Maximum ${label.toLowerCase()}`"
            @change="onMaxPointsInput"
          />
          <span v-else>{{ resolvedMaxPoints }}</span>
        </div>
      </div>

      <div
        class="grid flex-1 content-center items-center gap-2 sm:gap-3 md:gap-4"
        :style="tokenGridStyle"
      >
        <button
          v-for="index in resolvedMaxPoints"
          :key="index"
          type="button"
          class="btn btn-ghost btn-circle btn-sm min-h-11 min-w-11 justify-self-center p-0 transition-transform active:scale-95 sm:min-h-12 sm:min-w-12 md:min-h-14 md:min-w-14"
          :class="variant === 'destin' ? 'border border-base-300 bg-base-200/70' : ''"
          :disabled="!editable"
          :aria-label="`${ariaLabelPrefix} ${index}`"
          @click="setPoints(index)"
        >
          <svg
            class="h-12 w-12 transition-colors duration-200 sm:h-13 sm:w-13 md:h-14 md:w-14"
            :class="index <= resolvedPoints ? activeTokenClass : 'text-base-300 fill-base-200 stroke-base-300'"
            :viewBox="iconViewBox"
            aria-hidden="true"
          >
            <path :d="iconPath" />
          </svg>
        </button>

        <p v-if="resolvedMaxPoints === 0" class="text-sm text-base-content/60">Aucun point défini</p>
      </div>
    </div>
  </article>
</template>