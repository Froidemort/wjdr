<template>
	<label class="swap swap-rotate cursor-pointer btn btn-ghost btn-sm btn-square">
		<input
			type="checkbox"
			class="theme-controller hidden"
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
import { onMounted, ref, watch } from 'vue'
import { Sun, Moon } from '@lucide/vue'

const DARK_THEME = 'grimorium-dark'
const LIGHT_THEME = 'grimorium-light'
const THEME_STORAGE_KEY = 'theme'

const isDark = ref(false)

watch(isDark, (darkEnabled) => {
	const theme = darkEnabled ? DARK_THEME : LIGHT_THEME
	document.documentElement.setAttribute('data-theme', theme)
	localStorage.setItem(THEME_STORAGE_KEY, theme)
})

onMounted(() => {
	const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
	const currentTheme = document.documentElement.getAttribute('data-theme')

	if (storedTheme === DARK_THEME || storedTheme === LIGHT_THEME) {
		isDark.value = storedTheme === DARK_THEME
		return
	}

	if (currentTheme === DARK_THEME || currentTheme === LIGHT_THEME) {
		isDark.value = currentTheme === DARK_THEME
		return
	}

	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
	isDark.value = prefersDark
})
</script>
