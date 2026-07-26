<template>
	<label class="swap swap-rotate cursor-pointer btn btn-ghost btn-square min-h-11 min-w-11">
		<input
			type="checkbox"
			class="theme-controller sr-only"
			value="grimorium-dark"
			v-model="isDark"
			aria-label="Basculer le theme"
		/>
		
		<!-- Sun Icon (shown in light mode, swap-off) -->
		<div class="swap-off">
			<Sun class="h-5 w-5 opacity-70" />
		</div>
		
		<!-- Moon Icon (shown in dark mode, swap-on) -->
		<div class="swap-on">
			<Moon class="h-5 w-5 opacity-70" />
		</div>
	</label>
</template>

<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { computed } from 'vue'
import { useThemeStore } from '../../stores/theme'

const themeStore = useThemeStore()

const isDark = computed({
  get: () => themeStore.theme === 'grimorium-dark',
  set: (enabled: boolean) => {
    themeStore.setTheme(enabled ? 'grimorium-dark' : 'grimorium-light')
  },
})
</script>
