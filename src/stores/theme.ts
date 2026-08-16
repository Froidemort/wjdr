import { defineStore } from 'pinia'
import { usePreferredDark, useStorage } from '@vueuse/core'
import { ref } from 'vue'

export type ThemeName = 'grimorium-light' | 'grimorium-dark'

const THEME_STORAGE_KEY = 'theme'
const DARK_THEME: ThemeName = 'grimorium-dark'
const LIGHT_THEME: ThemeName = 'grimorium-light'

export const useThemeStore = defineStore('theme', () => {
  const prefersDark = usePreferredDark()
  const storedTheme = useStorage<ThemeName | null>(THEME_STORAGE_KEY, null)
  const theme = ref<ThemeName>(LIGHT_THEME)

  function setTheme(nextTheme: ThemeName): void {
    if (theme.value === nextTheme && document.documentElement.getAttribute('data-theme') === nextTheme) {
      return
    }

    theme.value = nextTheme
    document.documentElement.setAttribute('data-theme', nextTheme)
    storedTheme.value = nextTheme
  }

  function toggleTheme(): void {
    setTheme(theme.value === DARK_THEME ? LIGHT_THEME : DARK_THEME)
  }

  function initTheme(): void {
    const currentTheme = document.documentElement.getAttribute('data-theme')

    if (storedTheme.value === DARK_THEME || storedTheme.value === LIGHT_THEME) {
      setTheme(storedTheme.value)
      return
    }

    if (currentTheme === DARK_THEME || currentTheme === LIGHT_THEME) {
      setTheme(currentTheme)
      return
    }

    setTheme(prefersDark.value ? DARK_THEME : LIGHT_THEME)
  }

  return {
    theme,
    setTheme,
    toggleTheme,
    initTheme,
  }
})
