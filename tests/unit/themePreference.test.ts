import {
  applyThemePreference,
  normalizeThemePreference,
  readThemePreference,
  toggleThemePreference,
  writeThemePreference,
  type ThemePreference,
} from '../../src/ui/theme/themePreference'

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

describe('theme preference', () => {
  it('normalizes unknown values to heroic', () => {
    expect(normalizeThemePreference('classic')).toBe('classic')
    expect(normalizeThemePreference('heroic')).toBe('heroic')
    expect(normalizeThemePreference('invalid')).toBe('heroic')
    expect(normalizeThemePreference(undefined)).toBe('heroic')
  })

  it('reads and writes preference to storage', () => {
    const storage = new MemoryStorage()

    expect(readThemePreference(storage)).toBe('heroic')

    writeThemePreference('classic', storage)
    expect(readThemePreference(storage)).toBe('classic')

    writeThemePreference('heroic', storage)
    expect(readThemePreference(storage)).toBe('heroic')
  })

  it('toggles between heroic and classic', () => {
    expect(toggleThemePreference('heroic')).toBe('classic')
    expect(toggleThemePreference('classic')).toBe('heroic')
  })

  it('applies the preference on document element', () => {
    const attrs = new Map<string, string>()
    const element = {
      setAttribute: (name: string, value: string) => {
        attrs.set(name, value)
      },
      getAttribute: (name: string) => attrs.get(name) ?? null,
    } as unknown as HTMLElement

    applyThemePreference('classic', element)
    expect(element.getAttribute('data-theme')).toBe('classic')

    applyThemePreference('heroic', element)
    expect(element.getAttribute('data-theme')).toBe('heroic')
  })

  it('handles missing storage and document safely', () => {
    const noStorage = undefined
    const noElement = undefined
    const preference: ThemePreference = readThemePreference(noStorage)

    expect(preference).toBe('heroic')
    expect(() => writeThemePreference('classic', noStorage)).not.toThrow()
    expect(() => applyThemePreference('classic', noElement)).not.toThrow()
  })
})
