<template>
  <!-- Main Container -->
  <div 
    class="relative flex items-center justify-center" 
    :style="{ width: size, height: size }"
  >
    <!-- Dynamic Segments Loop -->
    <div
      v-for="index in maxValue"
      :key="index"
      class="radial-progress absolute inset-0 transition-colors duration-300"
      :class="index <= currentValue ? 'text-primary' : 'text-base-300'"
      :style="{
        '--value': segmentFillPercentage,
        '--size': size,
        '--thickness': thickness,
        transform: `rotate(${getRotationAngle(index)}deg)`
      } as Record<string, string | number>"
      role="progressbar"
      aria-label="Segment de barre de progression"
      :on-click="setCurrentValue(index)"
    ></div>

    <!-- Central Interactive Content -->
    <div class="absolute flex flex-col items-center justify-center gap-1 z-10">
      <slot name="content" :current="currentValue" :max="maxValue">
        <span class="text-xl text-base-content font-semibold">
          {{ currentValue }} / {{ maxValue }}
        </span>
        <button
        aria-label="reset-button">
            <!-- Reset Button -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-base-content hover:text-base-200 transition-colors duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              @click="resetToMaxValue"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        </button>
      </slot>
      
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Strict type interfaces for Props
interface Props {
  currentValue: number
  maxValue?: number
  editable?: boolean
  size?: string
  thickness?: string
  gapSize?: number
}

// Applying compiler defaults for optional props
const props = withDefaults(defineProps<Props>(), {
  maxValue: 4,
  size: '12rem',
  thickness: '0.85rem',
  gapSize: 6,
  editable: false,
})

// 1. Calculate the percentage weight of a single segment
const segmentSizePercentage = computed<number>(() => 100 / props.maxValue)

// 2. Compute the exact fill amount after taking the visual gap into account
const segmentFillPercentage = computed<number>(() => {
  const fill = segmentSizePercentage.value - props.gapSize
  return Math.max(fill, 1) // Safe baseline to avoid negative dimensions
})

// 3. Exact rotational calculations based on the total segments
const getRotationAngle = (index: number): number => {
  const degreesPerSegment = 360 / props.maxValue
  const baseRotation = -90 // Standard daisyUI 12 o'clock start position
  return baseRotation + (index - 1) * degreesPerSegment
}

const resetToMaxValue = () => {
  if (props.editable) {
    emit('update:currentValue', props.maxValue)
  }
}

// 4. Define function to set the current value based on user interaction (click on segment)
const setCurrentValue = (value: number) => {
  if (props.editable) {
    emit('update:currentValue', value)
  }
}

// 5. Emit event to parent component for two-way binding


const emit = defineEmits<{
  (e: 'update:currentValue', value: number): void
}>()

</script>
