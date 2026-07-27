<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { computed, useTemplateRef } from 'vue'
import { useThemeStore } from '../../stores/theme'
import { runAnimatedThemeToggle, type ThemeTransitionVariant } from '../../utils/themeTransition'

const props = withDefaults(
  defineProps<{
    duration?: number
    variant?: ThemeTransitionVariant
    fromCenter?: boolean
  }>(),
  {
    duration: 500,
    variant: 'circle',
    fromCenter: false,
  },
)

const themeStore = useThemeStore()
const buttonRef = useTemplateRef<HTMLButtonElement>('buttonRef')

const isDark = computed(() => themeStore.theme === 'grimorium-dark')

function toggleTheme(): void {
  runAnimatedThemeToggle({
    applyTheme: () => themeStore.toggleTheme(),
    button: buttonRef.value,
    duration: props.duration,
    variant: props.variant,
    fromCenter: props.fromCenter,
  })
}
</script>

<template>
  <button
    ref="buttonRef"
    type="button"
    class="btn btn-ghost btn-square min-h-11 min-w-11"
    aria-label="Basculer le thème"
    @click="toggleTheme"
  >
    <Sun v-if="isDark" class="size-5 opacity-70" aria-hidden="true" />
    <Moon v-else class="size-5 opacity-70" aria-hidden="true" />
  </button>
</template>
