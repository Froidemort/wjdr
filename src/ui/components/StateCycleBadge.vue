<script setup lang="ts">
import { computed } from 'vue'

type BadgeStateValue = string | boolean | null

interface BadgeStateOption {
  value: BadgeStateValue
  label: string
  badgeClass?: string
}

const props = withDefaults(defineProps<{
  value: BadgeStateValue
  options: readonly BadgeStateOption[]
  disabled?: boolean
}>(), {
  disabled: false
})

const emit = defineEmits<{
  (event: 'change', value: BadgeStateValue): void
}>()

const currentIndex = computed(() => {
  const index = props.options.findIndex((option) => option.value === props.value)
  return index >= 0 ? index : 0
})

const currentOption = computed(() => props.options[currentIndex.value] ?? props.options[0])

function cycleState(): void {
  if (props.disabled || props.options.length <= 1) {
    return
  }

  const nextIndex = (currentIndex.value + 1) % props.options.length
  const nextOption = props.options[nextIndex]
  emit('change', nextOption.value)
}
</script>

<template>
  <button
    type="button"
    class="badge badge-lg cursor-pointer px-3 font-warhammer tracking-wide transition-colors duration-500"
    :class="currentOption?.badgeClass ?? 'badge-outline'"
    :disabled="disabled"
    :aria-label="`Etat actuel: ${currentOption?.label ?? 'N/A'}. Activer pour changer.`"
    :aria-disabled="disabled ? 'true' : 'false'"
    @click="cycleState"
  >
    <span>{{ currentOption?.label ?? 'N/A' }}</span>
  </button>
</template>
