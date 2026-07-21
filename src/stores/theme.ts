import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeName = 'grimorium-light' | 'grimorium-dark'

const THEME_STORAGE_KEY = 'theme'
const DARK_THEME: ThemeName = 'grimorium-dark'
const LIGHT_THEME: ThemeName = 'grimorium-light'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeName>(LIGHT_THEME)

  function setTheme(nextTheme: ThemeName): void {
    theme.value = nextTheme
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  }

  function initTheme(): void {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    const currentTheme = document.documentElement.getAttribute('data-theme')

    if (storedTheme === DARK_THEME || storedTheme === LIGHT_THEME) {
      setTheme(storedTheme)
      return
    }

    if (currentTheme === DARK_THEME || currentTheme === LIGHT_THEME) {
      setTheme(currentTheme)
      return
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? DARK_THEME : LIGHT_THEME)
  }

  return {
    theme,
    setTheme,
    initTheme,
  }
})
