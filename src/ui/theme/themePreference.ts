export type ThemePreference = 'heroic' | 'classic'

const THEME_STORAGE_KEY = 'warhammer-theme-preference'
const DEFAULT_THEME: ThemePreference = 'heroic'

export const normalizeThemePreference = (value: unknown): ThemePreference =>
  value === 'classic' ? 'classic' : DEFAULT_THEME

const hasStorage = (storage: Storage | undefined): storage is Storage =>
  typeof storage !== 'undefined'

const hasDocumentElement = (element: HTMLElement | undefined): element is HTMLElement =>
  typeof element !== 'undefined'

export const readThemePreference = (storage: Storage | undefined = globalThis.localStorage): ThemePreference => {
  if (!hasStorage(storage)) {
    return DEFAULT_THEME
  }

  return normalizeThemePreference(storage.getItem(THEME_STORAGE_KEY))
}

export const writeThemePreference = (
  theme: ThemePreference,
  storage: Storage | undefined = globalThis.localStorage
): void => {
  if (!hasStorage(storage)) {
    return
  }

  storage.setItem(THEME_STORAGE_KEY, theme)
}

export const applyThemePreference = (
  theme: ThemePreference,
  element: HTMLElement | undefined = globalThis.document?.documentElement
): void => {
  if (!hasDocumentElement(element)) {
    return
  }

  element.setAttribute('data-theme', theme)
}

export const initializeThemePreference = (): ThemePreference => {
  const theme = readThemePreference()
  applyThemePreference(theme)
  return theme
}

export const toggleThemePreference = (current: ThemePreference): ThemePreference =>
  current === 'heroic' ? 'classic' : 'heroic'
