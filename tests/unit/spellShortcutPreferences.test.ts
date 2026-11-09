import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readSpellShortcut, saveSpellShortcut, spellShortcutKey } from '../../src/services/spellShortcutPreferencesRepository'
import { useSpellShortcutPreferencesStore } from '../../src/stores/spellShortcutPreferences'

describe('spell shortcut preferences', () => {
  let values: Map<string, string>
  beforeEach(() => {
    values = new Map()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    })
    setActivePinia(createPinia())
  })

  it('persists distinct categories by user and character, including accents', () => {
    saveSpellShortcut('user', 'one', ['Métal', 'Ciel', 'Métal'])
    saveSpellShortcut('user', 'two', ['Feu'])
    saveSpellShortcut('other', 'one', ['Vie'])
    expect(readSpellShortcut('user', 'one')).toEqual(['Métal', 'Ciel'])
    expect(readSpellShortcut('user', 'two')).toEqual(['Feu'])
    expect(readSpellShortcut('other', 'one')).toEqual(['Vie'])
  })

  it('rejects empty or corrupt stored preferences', () => {
    expect(() => saveSpellShortcut('u', 'c', [])).toThrow()
    values.set(spellShortcutKey('u', 'c'), '["Ciel", 42]')
    expect(() => readSpellShortcut('u', 'c')).toThrow()
  })

  it('reports write failures and preserves an explicitly temporary selection in memory', () => {
    const store = useSpellShortcutPreferencesStore()
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error('quota') })
    expect(store.save('u', 'c', ['Feu'])).toBe(false)
    expect(store.get('u', 'c').categories).toBeNull()
    expect(store.get('u', 'c').error).toMatch(/Enregistrement impossible/)
    store.useTemporarily('u', 'c', ['Feu'])
    expect(store.get('u', 'c')).toMatchObject({ categories: ['Feu'], temporary: true })
    expect(readSpellShortcut('u', 'c')).toBeNull()
    expect(store.get('u', 'other').categories).toBeNull()
  })

  it('reports storage read errors without inventing a preference', () => {
    vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error('denied') })
    const preference = useSpellShortcutPreferencesStore().get('u', 'c')
    expect(preference.categories).toBeNull()
    expect(preference.error).toMatch(/Lecture.*impossible/)
  })
})
