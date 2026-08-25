<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    maxHp: number
    label?: string
    editable?: boolean
  }>(),
  {
    modelValue: 0,
    maxHp: 0,
    label: 'Blessures',
    editable: true,
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void
}>()

const isBeating = ref(false)

const resolvedMaxHp = computed(() => Math.max(0, Math.floor(props.maxHp)))

const clampedCurrentHp = computed(() =>
  Math.min(resolvedMaxHp.value, Math.max(0, Math.floor(props.modelValue)))
)

const heartBeatDuration = computed(() => {
  if (clampedCurrentHp.value <= 3) {
    return 220
  }
  if (clampedCurrentHp.value <= resolvedMaxHp.value / 2) {
    return 420
  }
  return 620
})

const heartBeatDurationCss = computed(() => `${heartBeatDuration.value}ms`)

function triggerHeartbeat(): void {
  isBeating.value = true
  setTimeout(() => {
    isBeating.value = false
  }, heartBeatDuration.value)
}

function updateCurrentHp(nextValue: number): void {
  const sanitized = Math.min(
    resolvedMaxHp.value,
    Math.max(0, Math.floor(Number(nextValue) || 0))
  )

  if (sanitized !== props.modelValue) {
    emit('update:modelValue', sanitized)
    triggerHeartbeat()
  }
}

const currentHpModel = computed({
  get: () => clampedCurrentHp.value,
  set: (value: number) => {
    if (!props.editable) {
      return
    }
    updateCurrentHp(value)
  },
})

const hpPercentage = computed(() => {
  if (resolvedMaxHp.value <= 0) {
    return 0
  }
  return Math.min(100, Math.max(0, (clampedCurrentHp.value / resolvedMaxHp.value) * 100))
})

const hpFillMaskStyle = computed(() => ({
  clipPath: `inset(${100 - hpPercentage.value}% 0 0 0)`,
}))

const hpColorClass = computed(() => {
  if (clampedCurrentHp.value <= 3) {
    return 'text-error'
  }
  if (clampedCurrentHp.value <= resolvedMaxHp.value / 2) {
    return 'text-warning'
  }
  return 'text-success'
})

function decrease(): void {
  if (!props.editable || clampedCurrentHp.value <= 0) {
    return
  }
  updateCurrentHp(clampedCurrentHp.value - 1)
}

function increase(): void {
  if (!props.editable || clampedCurrentHp.value >= resolvedMaxHp.value) {
    return
  }
  updateCurrentHp(clampedCurrentHp.value + 1)
}

watch(
  () => props.modelValue,
  () => {
    triggerHeartbeat()
  }
)
</script>

<template>
  <article class="card border border-base-300 bg-base-100 min-w-0 h-full">
    <div class="card-body gap-2 p-3 sm:gap-3 sm:p-4 md:min-h-64">
      <div class="flex items-baseline justify-between gap-2">
        <p class="text-sm font-semibold leading-tight text-base-content/85">{{ label }}</p>
        <p class="text-sm font-semibold tabular-nums text-base-content/75">
          {{ clampedCurrentHp }} / {{ resolvedMaxHp }}
        </p>
      </div>

      <div
        class="select-none"
        :class="editable ? 'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3' : 'flex justify-center'"
      >
        <button
          v-if="editable"
          type="button"
          class="btn btn-circle btn-sm min-h-11 min-w-11 border border-base-300 bg-base-100 text-base-content transition-transform active:scale-95"
          :disabled="clampedCurrentHp <= 0"
          aria-label="Diminuer les blessures"
          @click="decrease"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" />
          </svg>
        </button>

        <div
          class="relative mx-auto aspect-square w-full max-w-36 sm:max-w-44 md:max-w-48 transition-transform duration-300"
          :class="{ 'animate-heartbeat': isBeating }"
        >
          <svg class="absolute inset-0 h-full w-full fill-current text-base-300" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>

          <svg
            class="absolute inset-0 h-full w-full fill-current transition-[clip-path] duration-500 ease-out"
            :class="hpColorClass"
            :style="hpFillMaskStyle"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>

          <div class="absolute inset-0 z-10 flex items-center justify-center">
            <div class="flex flex-col items-center justify-center text-base-content leading-none">
              <input
                v-if="editable"
                v-model.number="currentHpModel"
                type="number"
                min="0"
                :max="resolvedMaxHp"
                class="w-16 bg-transparent text-center text-4xl font-black [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:w-20 sm:text-5xl"
                aria-label="Blessures actuelles"
              />
              <span v-else class="w-16 text-center text-4xl font-black sm:w-20 sm:text-5xl">{{ clampedCurrentHp }}</span>
              <span class="mt-1 text-sm font-bold opacity-85 sm:text-base">/ {{ resolvedMaxHp }}</span>
            </div>
          </div>
        </div>

        <button
          v-if="editable"
          type="button"
          class="btn btn-circle btn-sm min-h-11 min-w-11 border border-base-300 bg-base-100 text-base-content transition-transform active:scale-95"
          :disabled="clampedCurrentHp >= resolvedMaxHp"
          aria-label="Augmenter les blessures"
          @click="increase"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.12);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.12);
  }
  70% {
    transform: scale(1);
  }
}

.animate-heartbeat {
  animation: heartbeat v-bind(heartBeatDurationCss) ease-in-out;
}
</style>