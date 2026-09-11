import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const themeSupport = vi.hoisted(() => ({
  prefersDark: { value: false },
  storedTheme: { value: null as 'grimorium-light' | 'grimorium-dark' | null },
}))

vi.mock('@vueuse/core', () => ({
  usePreferredDark: () => themeSupport.prefersDark,
  useStorage: () => themeSupport.storedTheme,
}))

import { useAuthFormStore } from '../../src/stores/authForm'
import { useCampaignCreateModalStore } from '../../src/stores/campaignCreateModal'
import { useThemeStore } from '../../src/stores/theme'

describe('local stores', () => {
  const attributes = new Map<string, string>()

  beforeEach(() => {
    setActivePinia(createPinia())
    attributes.clear()
    themeSupport.prefersDark.value = false
    themeSupport.storedTheme.value = null
    vi.stubGlobal('document', {
      documentElement: {
        getAttribute: (name: string) => attributes.get(name) ?? null,
        setAttribute: (name: string, value: string) => attributes.set(name, value),
      },
    })
  })

  it('switches authentication mode and modal visibility', () => {
    const authForm = useAuthFormStore()
    const modal = useCampaignCreateModalStore()

    authForm.setMode('signup')
    modal.openModal()
    expect(authForm.mode).toBe('signup')
    expect(modal.isOpen).toBe(true)
    modal.closeModal()
    expect(modal.isOpen).toBe(false)
  })

  it('initializes, persists, and toggles the theme', () => {
    themeSupport.prefersDark.value = true
    const theme = useThemeStore()

    theme.initTheme()
    expect(theme.theme).toBe('grimorium-dark')
    expect(attributes.get('data-theme')).toBe('grimorium-dark')
    expect(themeSupport.storedTheme.value).toBe('grimorium-dark')
    theme.toggleTheme()
    expect(theme.theme).toBe('grimorium-light')
  })

  it('uses an existing persisted theme before the system preference', () => {
    themeSupport.prefersDark.value = true
    themeSupport.storedTheme.value = 'grimorium-light'
    const theme = useThemeStore()

    theme.initTheme()

    expect(theme.theme).toBe('grimorium-light')
    expect(attributes.get('data-theme')).toBe('grimorium-light')
  })
})