import type { CharacterRace } from '../types/character'
import type {
  CharacterArmor,
  CharacterItem,
  CharacterSkill,
  CharacterStatValue,
  CharacterTalent,
  CharacterWeapon,
} from '../types/domain'

export const CHARACTERISTICS_ORDER = [
  'CC',
  'CT',
  'F',
  'E',
  'AG',
  'INT',
  'FM',
  'SOC',
  'A',
  'M',
  'MAG',
] as const

const PRIMARY_CHARACTERISTICS = CHARACTERISTICS_ORDER.slice(0, 8)

const CHARACTERISTICS_INDEX = new Map<string, number>(
  CHARACTERISTICS_ORDER.map((code, index) => [code, index])
)

const ENCUMBRANCE_MULTIPLIER_BY_RACE: Record<CharacterRace, number> = {
  humain: 10,
  elfe: 10,
  nain: 20,
  halfling: 10,
}

const TABLE_HIGHLIGHT_LIMIT = 6

export function normalizeStatCode(code: string): string {
  return code.trim().toUpperCase()
}

export function sortStatsByCharacteristicOrder<T extends { statCode: string }>(
  stats: readonly T[]
): T[] {
  return [...stats].sort((left, right) => {
    const leftCode = normalizeStatCode(left.statCode)
    const rightCode = normalizeStatCode(right.statCode)
    const leftIndex = CHARACTERISTICS_INDEX.get(leftCode)
    const rightIndex = CHARACTERISTICS_INDEX.get(rightCode)

    if (leftIndex === undefined && rightIndex === undefined) {
      return leftCode.localeCompare(rightCode)
    }
    if (leftIndex === undefined) {
      return 1
    }
    if (rightIndex === undefined) {
      return -1
    }

    return leftIndex - rightIndex
  })
}

export function getStatTotal(stats: readonly CharacterStatValue[], code: string): number {
  const target = normalizeStatCode(code)
  const stat = stats.find((entry) => normalizeStatCode(entry.statCode) === target)
  if (!stat) {
    return 0
  }

  return Math.max(0, stat.baseValue + stat.currentAdvanced)
}

export function getStatBonus(stats: readonly CharacterStatValue[], code: string): number {
  return Math.floor(getStatTotal(stats, code) / 10)
}

export function computeMaxEncumbrance(
  race: CharacterRace,
  stats: readonly CharacterStatValue[]
): number {
  return getStatTotal(stats, 'F') * (ENCUMBRANCE_MULTIPLIER_BY_RACE[race] ?? 10)
}

export function computeTotalEncumbrance(links: {
  weapons: readonly CharacterWeapon[]
  armors: readonly CharacterArmor[]
  items: readonly CharacterItem[]
}): number {
  const weapons = links.weapons.reduce((total, weapon) => total + (weapon.encumbrance ?? 0), 0)
  const armors = links.armors.reduce((total, armor) => total + (armor.encumbrance ?? 0), 0)
  const items = links.items.reduce(
    (total, item) => total + (item.encumbrance ?? 0) * Math.max(1, item.quantity),
    0
  )

  return weapons + armors + items
}

function byName<T extends { name: string }>(left: T, right: T): number {
  return left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' })
}

export interface CharacterTableHighlights {
  mainStats: Array<{ statCode: string; value: number }>
  equippedWeapons: CharacterWeapon[]
  equippedArmors: CharacterArmor[]
  skills: CharacterSkill[]
  talents: CharacterTalent[]
  hiddenSkillCount: number
  hiddenTalentCount: number
  totalEncumbrance: number
  maxEncumbrance: number
}

// Compact read-only digest for the MJ table; skills with a higher mastery come first.
export function buildCharacterTableHighlights(input: {
  race: CharacterRace
  stats: readonly CharacterStatValue[]
  links: {
    skills: readonly CharacterSkill[]
    talents: readonly CharacterTalent[]
    weapons: readonly CharacterWeapon[]
    armors: readonly CharacterArmor[]
    items: readonly CharacterItem[]
  }
}): CharacterTableHighlights {
  const { race, stats, links } = input

  const mainStats = sortStatsByCharacteristicOrder(
    stats.filter((stat) =>
      (PRIMARY_CHARACTERISTICS as readonly string[]).includes(normalizeStatCode(stat.statCode))
    )
  ).map((stat) => ({
    statCode: normalizeStatCode(stat.statCode),
    value: Math.max(0, stat.baseValue + stat.currentAdvanced),
  }))

  const rankedSkills = [...links.skills].sort(
    (left, right) => right.masteryLevel - left.masteryLevel || byName(left, right)
  )
  const sortedTalents = [...links.talents].sort(byName)

  return {
    mainStats,
    equippedWeapons: links.weapons.filter((weapon) => weapon.equipped !== null).sort(byName),
    equippedArmors: links.armors.filter((armor) => armor.isEquipped).sort(byName),
    skills: rankedSkills.slice(0, TABLE_HIGHLIGHT_LIMIT),
    talents: sortedTalents.slice(0, TABLE_HIGHLIGHT_LIMIT),
    hiddenSkillCount: Math.max(0, rankedSkills.length - TABLE_HIGHLIGHT_LIMIT),
    hiddenTalentCount: Math.max(0, sortedTalents.length - TABLE_HIGHLIGHT_LIMIT),
    totalEncumbrance: computeTotalEncumbrance(links),
    maxEncumbrance: computeMaxEncumbrance(race, stats),
  }
}

export function formatNamedWithSpecialization(name: string, specialization: string | null): string {
  const trimmed = specialization?.trim()
  return trimmed ? `${name} (${trimmed})` : name
}

export function formatMoney(gold: number, silver: number, copper: number): string {
  return `${gold} CO · ${silver} PA · ${copper} S`
}
