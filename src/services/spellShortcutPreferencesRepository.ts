const PREFIX = 'wjdr:spell-shortcut:v1:'

export function spellShortcutKey(userId: string, characterId: string): string {
  return PREFIX + JSON.stringify([userId, characterId])
}

export function readSpellShortcut(userId: string, characterId: string): string[] | null {
  const raw = localStorage.getItem(spellShortcutKey(userId, characterId))
  if (raw === null) return null
  const value: unknown = JSON.parse(raw)
  if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === 'string' && item.length > 0)) {
    throw new Error('Préférence de sorts invalide')
  }
  return [...new Set(value)]
}

export function saveSpellShortcut(userId: string, characterId: string, categories: string[]): void {
  if (!categories.length || categories.some((category) => !category)) {
    throw new Error('Sélectionne au moins une catégorie')
  }
  localStorage.setItem(spellShortcutKey(userId, characterId), JSON.stringify([...new Set(categories)]))
}
