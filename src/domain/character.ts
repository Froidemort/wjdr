import { nanoid } from 'nanoid'

export type CharacteristicKey = 'cc' | 'ct' | 'f' | 'e' | 'ag' | 'int' | 'fm' | 'soc'

export type RaceKey = 'human' | 'dwarf' | 'halfling' | 'elf'

export interface RaceOption {
  key: RaceKey
  label: string
}

export interface CatalogEntry {
  id: string
  name: string
  specialization?: string
}

export interface CharacterSkill {
  id: string
  skillId: string
  specialization?: string
  mastery: SkillMastery
}

export interface CharacterTalent {
  id: string
  talentId: string
  specialization?: string
}

export interface CharacterCareers {
  current: string | null
  previous: string[]
}

export interface CharacteristicValue {
  base: number
  advance: number
  ticks: number
}

export type SkillMastery = 0 | 10 | 20

export interface SkillMasteryOption {
  value: SkillMastery
  label: string
}

export type Characteristics = Record<CharacteristicKey, CharacteristicValue>

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  weight: number
  equipped: boolean
}

export interface Money {
  co: number
  pa: number
  s: number
}

export interface Experience {
  total: number
  spent: number
  available: number
}

export interface TrackedResource {
  current: number
  max: number
}

export interface Character {
  id: string
  name: string
  race: RaceKey
  wounds: {
    current: number
    max: number
  }
  fortune: TrackedResource
  fate: TrackedResource
  money: Money
  experience: Experience
  characteristics: Characteristics
  skills: CharacterSkill[]
  talents: CharacterTalent[]
  careers: CharacterCareers
  inventory: InventoryItem[]
  actions: number
  actionsTicks: number
  movement: number
  magic: number
  magicTicks: number
  bonusForceTicks: number
  insanity: number
  createdAt: string
  updatedAt: string
}

const defaultCharacteristics = (): Characteristics => ({
  cc: { base: 30, advance: 0, ticks: 0 },
  ct: { base: 30, advance: 0, ticks: 0 },
  f: { base: 30, advance: 0, ticks: 0 },
  e: { base: 30, advance: 0, ticks: 0 },
  ag: { base: 30, advance: 0, ticks: 0 },
  int: { base: 30, advance: 0, ticks: 0 },
  fm: { base: 30, advance: 0, ticks: 0 },
  soc: { base: 30, advance: 0, ticks: 0 }
})

export const RACE_OPTIONS: RaceOption[] = [
  { key: 'human', label: 'Humain' },
  { key: 'dwarf', label: 'Nain' },
  { key: 'halfling', label: 'Halfling' },
  { key: 'elf', label: 'Elfe' }
]

export const SKILL_CATALOG: CatalogEntry[] = [
  { id: 'general-knowledge-empire', name: 'Connaissances générales', specialization: 'Empire' },
  { id: 'language-reikspiel', name: 'Langue', specialization: 'reikspiel' },
  { id: 'academic-knowledge-magic', name: 'Connaissance académiques', specialization: 'Magie' },
  { id: 'focus', name: 'Focalisation' },
  { id: 'read-write', name: 'Lire/Écrire' },
  { id: 'perception', name: 'Perception' },
  { id: 'sense-magic', name: 'Sens de la magie' },
  { id: 'gossip', name: 'Commérage' },
  { id: 'search', name: 'Fouille' }
]

export const TALENT_CATALOG: CatalogEntry[] = [
  { id: 'lightning-reflexes', name: 'Réflexes éclair' },
  { id: 'sixth-sense', name: 'Sixième sens' },
  { id: 'aethyric-attunement', name: 'Harmonie Aethyrique' },
  { id: 'intelligent', name: 'Intelligent' },
  { id: 'magine-commune-occult', name: 'Magine commune', specialization: 'occulte' }
]

export const CAREER_CATALOG: string[] = [
  'Apprenti Sorcier',
  'Combattant des tunnels',
  'Fanatique',
  'Tueur de trolls',
  'Chasseur de primes'
]

export const SKILL_MASTERY_OPTIONS: SkillMasteryOption[] = [
  { value: 0, label: 'Acquis' },
  { value: 10, label: '+10%' },
  { value: 20, label: '+20%' }
]

const defaultRace = (): RaceKey => 'human'

const defaultCareers = (): CharacterCareers => ({
  current: null,
  previous: []
})

const defaultMoney = (): Money => ({
  co: 0,
  pa: 0,
  s: 0
})

const defaultExperience = (): Experience => ({
  total: 0,
  spent: 0,
  available: 0
})

const defaultFortune = (): TrackedResource => ({
  current: 2,
  max: 2
})

const defaultFate = (): TrackedResource => ({
  current: 1,
  max: 1
})

const raceSet = new Set<RaceKey>(RACE_OPTIONS.map((option) => option.key))
const skillSet = new Set<string>(SKILL_CATALOG.map((entry) => entry.id))
const talentSet = new Set<string>(TALENT_CATALOG.map((entry) => entry.id))
const careerSet = new Set<string>(CAREER_CATALOG)
const masterySet = new Set<SkillMastery>(SKILL_MASTERY_OPTIONS.map((option) => option.value))

const isRaceKey = (value: unknown): value is RaceKey =>
  typeof value === 'string' && raceSet.has(value as RaceKey)

export const formatNameWithSpecialization = (name: string, specialization?: string): string =>
  specialization ? `${name} (${specialization})` : name

export const formatSkillMasteryLabel = (mastery: SkillMastery): string => {
  const option = SKILL_MASTERY_OPTIONS.find((entry) => entry.value === mastery)
  return option?.label ?? 'Acquis'
}

const getCatalogEntry = (catalog: CatalogEntry[], id: string): CatalogEntry | undefined =>
  catalog.find((entry) => entry.id === id)

export const formatSkillLabel = (skill: CharacterSkill): string => {
  const entry = getCatalogEntry(SKILL_CATALOG, skill.skillId)
  if (!entry) {
    return skill.skillId
  }

  return `${formatNameWithSpecialization(entry.name, skill.specialization)} - ${formatSkillMasteryLabel(skill.mastery)}`
}

export const formatTalentLabel = (talent: CharacterTalent): string => {
  const entry = getCatalogEntry(TALENT_CATALOG, talent.talentId)
  if (!entry) {
    return talent.talentId
  }

  return formatNameWithSpecialization(entry.name, talent.specialization)
}

const toUnit = (value: number): number => Math.max(0, Math.trunc(value))

const moneyToSous = (money: Money): number =>
  toUnit(money.co) * 240 + toUnit(money.pa) * 12 + toUnit(money.s)

export const sousToMoney = (totalSous: number): Money => {
  const sous = clampAtZero(totalSous)
  const co = Math.floor(sous / 240)
  const remainderAfterCo = sous % 240
  const pa = Math.floor(remainderAfterCo / 12)
  const s = remainderAfterCo % 12

  return { co, pa, s }
}

export const normalizeMoney = (money: Money): Money => sousToMoney(moneyToSous(money))

export const normalizeExperience = (experience: Experience): Experience => {
  const spent = clampAtZero(experience.spent)
  const available = clampAtZero(experience.available)

  return {
    spent,
    available,
    total: spent + available
  }
}

export const createCharacter = (name: string): Character => {
  const now = new Date().toISOString()

  return {
    id: nanoid(10),
    name: name.trim(),
    race: defaultRace(),
    wounds: {
      current: 10,
      max: 10
    },
    fortune: defaultFortune(),
    fate: defaultFate(),
    money: defaultMoney(),
    experience: defaultExperience(),
    characteristics: defaultCharacteristics(),
    skills: [],
    talents: [],
    careers: defaultCareers(),
    inventory: [],
    actions: 1,
    actionsTicks: 0,
    movement: 4,
    magic: 0,
    magicTicks: 0,
    bonusForceTicks: 0,
    insanity: 0,
    createdAt: now,
    updatedAt: now
  }
}

export const getCharacteristicTotal = (
  character: Character,
  key: CharacteristicKey
): number => character.characteristics[key].base + character.characteristics[key].ticks * 5

export const getActionsTotal = (character: Character): number =>
  character.actions + character.actionsTicks

export const getMagicTotal = (character: Character): number =>
  character.magic + character.magicTicks

export const getBonusForce = (character: Character): number => {
  const total = getCharacteristicTotal(character, 'f')
  return Math.floor(total / 10) + character.bonusForceTicks
}

export const getBonusEndurance = (character: Character): number => {
  const total = getCharacteristicTotal(character, 'e')
  return Math.floor(total / 10)
}

const clampAtZero = (value: number): number => Math.max(0, Math.trunc(value))

export interface ResourcePatch {
  woundsCurrent?: number
  woundsMax?: number
  fortuneCurrent?: number
  fortuneMax?: number
  fateCurrent?: number
  fateMax?: number
}

export interface MoneyPatch {
  co?: number
  pa?: number
  s?: number
}

export const patchResources = (
  character: Character,
  patch: ResourcePatch
): Character => {
  const woundsMax = patch.woundsMax ?? character.wounds.max
  const woundsCurrentRaw = patch.woundsCurrent ?? character.wounds.current
  const woundsCurrent = Math.min(clampAtZero(woundsCurrentRaw), clampAtZero(woundsMax))
  const fortuneMax = clampAtZero(patch.fortuneMax ?? character.fortune.max)
  const fortuneCurrent = Math.min(
    clampAtZero(patch.fortuneCurrent ?? character.fortune.current),
    fortuneMax
  )
  const fateMax = clampAtZero(patch.fateMax ?? character.fate.max)
  const fateCurrent = Math.min(
    clampAtZero(patch.fateCurrent ?? character.fate.current),
    fateMax
  )

  return {
    ...character,
    wounds: {
      current: woundsCurrent,
      max: clampAtZero(woundsMax)
    },
    fortune: {
      current: fortuneCurrent,
      max: fortuneMax
    },
    fate: {
      current: fateCurrent,
      max: fateMax
    },
    updatedAt: new Date().toISOString()
  }
}

export const patchMoney = (character: Character, patch: MoneyPatch): Character => {
  const nextMoney = normalizeMoney({
    co: patch.co ?? character.money.co,
    pa: patch.pa ?? character.money.pa,
    s: patch.s ?? character.money.s
  })

  return {
    ...character,
    money: nextMoney,
    updatedAt: new Date().toISOString()
  }
}

export const renameCharacter = (character: Character, name: string): Character => ({
  ...character,
  name: name.trim(),
  updatedAt: new Date().toISOString()
})

const normalizeInventoryItem = (item: InventoryItem): InventoryItem => ({
  ...item,
  name: item.name.trim(),
  quantity: clampAtZero(item.quantity),
  weight: clampAtZero(item.weight),
  equipped: Boolean(item.equipped)
})

const normalizeSpecialization = (value: unknown, fallback?: string): string | undefined => {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const normalizeSkillMastery = (value: unknown, fallback: SkillMastery = 0): SkillMastery => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  const truncated = Math.trunc(value) as SkillMastery
  return masterySet.has(truncated) ? truncated : fallback
}

const normalizeCharacterSkill = (skill: CharacterSkill): CharacterSkill | null => {
  if (!skillSet.has(skill.skillId)) {
    return null
  }

  const entry = getCatalogEntry(SKILL_CATALOG, skill.skillId)
  const specialization = normalizeSpecialization(skill.specialization, entry?.specialization)

  return {
    id: skill.id,
    skillId: skill.skillId,
    specialization,
    mastery: normalizeSkillMastery(skill.mastery)
  }
}

const normalizeCharacterTalent = (talent: CharacterTalent): CharacterTalent | null => {
  if (!talentSet.has(talent.talentId)) {
    return null
  }

  const entry = getCatalogEntry(TALENT_CATALOG, talent.talentId)
  const specialization = normalizeSpecialization(talent.specialization, entry?.specialization)

  return {
    id: talent.id,
    talentId: talent.talentId,
    specialization
  }
}

const normalizeCareers = (careers: CharacterCareers): CharacterCareers => {
  const current = careers.current && careerSet.has(careers.current) ? careers.current : null
  const previous = careers.previous.filter((career) => careerSet.has(career) && career !== current)

  return {
    current,
    previous: [...new Set(previous)]
  }
}

export const patchInventory = (
  character: Character,
  inventory: InventoryItem[]
): Character => ({
  ...character,
  inventory: inventory
    .map(normalizeInventoryItem)
    .filter((item) => item.name.length > 0),
  updatedAt: new Date().toISOString()
})

export const patchSkills = (character: Character, skills: CharacterSkill[]): Character => {
  const nextSkills = skills
    .map(normalizeCharacterSkill)
    .filter((skill): skill is CharacterSkill => skill !== null)

  return {
    ...character,
    skills: nextSkills,
    updatedAt: new Date().toISOString()
  }
}

export const patchTalents = (character: Character, talents: CharacterTalent[]): Character => {
  const nextTalents = talents
    .map(normalizeCharacterTalent)
    .filter((talent): talent is CharacterTalent => talent !== null)

  return {
    ...character,
    talents: nextTalents,
    updatedAt: new Date().toISOString()
  }
}

export const patchCareers = (character: Character, careers: CharacterCareers): Character => ({
  ...character,
  careers: normalizeCareers(careers),
  updatedAt: new Date().toISOString()
})

export const isValidCharacter = (character: Character): boolean => {
  if (!character.id || !character.name.trim()) {
    return false
  }

  if (character.wounds.max < 0 || character.wounds.current < 0) {
    return false
  }

  if (character.wounds.current > character.wounds.max) {
    return false
  }

  if (character.fortune.max < 0 || character.fortune.current < 0) {
    return false
  }

  if (character.fortune.current > character.fortune.max) {
    return false
  }

  if (character.fate.max < 0 || character.fate.current < 0) {
    return false
  }

  if (character.fate.current > character.fate.max) {
    return false
  }

  if (character.inventory.some((item) => !item.name.trim() || item.quantity < 0 || item.weight < 0)) {
    return false
  }

  if (character.money.co < 0 || character.money.pa < 0 || character.money.s < 0) {
    return false
  }

  if (character.money.pa >= 20 || character.money.s >= 12) {
    return false
  }

  if (character.experience.spent < 0 || character.experience.available < 0) {
    return false
  }

  if (character.experience.total !== character.experience.spent + character.experience.available) {
    return false
  }

  if (!isRaceKey(character.race)) {
    return false
  }

  if (
    character.skills.some(
      (skill) => !skill.id || !skillSet.has(skill.skillId) || !masterySet.has(skill.mastery)
    )
  ) {
    return false
  }

  if (character.talents.some((talent) => !talent.id || !talentSet.has(talent.talentId))) {
    return false
  }

  if (character.careers.current && !careerSet.has(character.careers.current)) {
    return false
  }

  if (character.careers.previous.some((career) => !careerSet.has(career))) {
    return false
  }

  if (
    character.careers.current &&
    character.careers.previous.includes(character.careers.current)
  ) {
    return false
  }

  if (character.actions < 1 || character.movement <= 0 || character.magic < 0 || character.insanity < 0) {
    return false
  }

  if (character.actionsTicks < 0 || character.magicTicks < 0 || character.bonusForceTicks < 0) {
    return false
  }

  return true
}

export const toCharacterExportJson = (character: Character): string =>
  JSON.stringify(character, null, 2)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const asFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return value
}

const asIsoDate = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback
  }

  return Number.isNaN(Date.parse(value)) ? fallback : value
}

const normalizeImportedMoney = (value: unknown): Money => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Backward compatibility with previous numeric money representation.
    return sousToMoney(value)
  }

  if (!isRecord(value)) {
    return defaultMoney()
  }

  return normalizeMoney({
    co: asFiniteNumber(value.co, 0),
    pa: asFiniteNumber(value.pa, 0),
    s: asFiniteNumber(value.s, 0)
  })
}

const normalizeImportedExperience = (value: unknown): Experience => {
  if (!isRecord(value)) {
    return defaultExperience()
  }

  return normalizeExperience({
    total: asFiniteNumber(value.total, 0),
    spent: asFiniteNumber(value.spent, 0),
    available: asFiniteNumber(value.available, 0)
  })
}

const normalizeImportedTrackedResource = (
  value: unknown,
  fallback: TrackedResource
): TrackedResource => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const resource = clampAtZero(value)
    return {
      current: resource,
      max: resource
    }
  }

  if (!isRecord(value)) {
    return fallback
  }

  const max = clampAtZero(asFiniteNumber(value.max, fallback.max))
  const current = Math.min(clampAtZero(asFiniteNumber(value.current, fallback.current)), max)

  return {
    current,
    max
  }
}

const normalizeImportedSkills = (value: unknown): CharacterSkill[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isRecord)
    .map((entry): CharacterSkill => ({
      id: typeof entry.id === 'string' && entry.id ? entry.id : nanoid(10),
      skillId: typeof entry.skillId === 'string' ? entry.skillId : '',
      specialization: normalizeSpecialization(entry.specialization),
      mastery: normalizeSkillMastery(entry.mastery)
    }))
    .map(normalizeCharacterSkill)
    .filter((skill): skill is CharacterSkill => skill !== null)
}

const normalizeImportedTalents = (value: unknown): CharacterTalent[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isRecord)
    .map((entry): CharacterTalent => ({
      id: typeof entry.id === 'string' && entry.id ? entry.id : nanoid(10),
      talentId: typeof entry.talentId === 'string' ? entry.talentId : '',
      specialization: normalizeSpecialization(entry.specialization)
    }))
    .map(normalizeCharacterTalent)
    .filter((talent): talent is CharacterTalent => talent !== null)
}

const normalizeImportedCareers = (raw: Record<string, unknown>): CharacterCareers => {
  if (isRecord(raw.careers)) {
    const current = typeof raw.careers.current === 'string' ? raw.careers.current : null
    const previous = Array.isArray(raw.careers.previous)
      ? raw.careers.previous.filter((career): career is string => typeof career === 'string')
      : []

    return normalizeCareers({ current, previous })
  }

  // Backward compatibility for older careerIds format.
  if (Array.isArray(raw.careerIds)) {
    const previous = raw.careerIds.filter((career): career is string => typeof career === 'string')
    return normalizeCareers({ current: null, previous })
  }

  return defaultCareers()
}

const normalizeInventory = (value: unknown): InventoryItem[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isRecord)
    .map((item): InventoryItem => ({
      id: typeof item.id === 'string' && item.id ? item.id : nanoid(10),
      name: typeof item.name === 'string' ? item.name.trim() : '',
      quantity: clampAtZero(asFiniteNumber(item.quantity, 1)),
      weight: clampAtZero(asFiniteNumber(item.weight, 0)),
      equipped: Boolean(item.equipped)
    }))
    .filter((item) => item.name.length > 0)
}

const normalizeCharacteristics = (value: unknown): Characteristics => {
  const fallback = defaultCharacteristics()
  if (!isRecord(value)) {
    return fallback
  }

  return {
    cc: {
      base: clampAtZero(asFiniteNumber(value.cc && isRecord(value.cc) ? value.cc.base : undefined, fallback.cc.base)),
      advance: clampAtZero(asFiniteNumber(value.cc && isRecord(value.cc) ? value.cc.advance : undefined, fallback.cc.advance)),
      ticks: clampAtZero(asFiniteNumber(value.cc && isRecord(value.cc) ? value.cc.ticks : undefined, fallback.cc.ticks))
    },
    ct: {
      base: clampAtZero(asFiniteNumber(value.ct && isRecord(value.ct) ? value.ct.base : undefined, fallback.ct.base)),
      advance: clampAtZero(asFiniteNumber(value.ct && isRecord(value.ct) ? value.ct.advance : undefined, fallback.ct.advance)),
      ticks: clampAtZero(asFiniteNumber(value.ct && isRecord(value.ct) ? value.ct.ticks : undefined, fallback.ct.ticks))
    },
    f: {
      base: clampAtZero(asFiniteNumber(value.f && isRecord(value.f) ? value.f.base : undefined, fallback.f.base)),
      advance: clampAtZero(asFiniteNumber(value.f && isRecord(value.f) ? value.f.advance : undefined, fallback.f.advance)),
      ticks: clampAtZero(asFiniteNumber(value.f && isRecord(value.f) ? value.f.ticks : undefined, fallback.f.ticks))
    },
    e: {
      base: clampAtZero(asFiniteNumber(value.e && isRecord(value.e) ? value.e.base : undefined, fallback.e.base)),
      advance: clampAtZero(asFiniteNumber(value.e && isRecord(value.e) ? value.e.advance : undefined, fallback.e.advance)),
      ticks: clampAtZero(asFiniteNumber(value.e && isRecord(value.e) ? value.e.ticks : undefined, fallback.e.ticks))
    },
    ag: {
      base: clampAtZero(asFiniteNumber(value.ag && isRecord(value.ag) ? value.ag.base : undefined, fallback.ag.base)),
      advance: clampAtZero(asFiniteNumber(value.ag && isRecord(value.ag) ? value.ag.advance : undefined, fallback.ag.advance)),
      ticks: clampAtZero(asFiniteNumber(value.ag && isRecord(value.ag) ? value.ag.ticks : undefined, fallback.ag.ticks))
    },
    int: {
      base: clampAtZero(asFiniteNumber(value.int && isRecord(value.int) ? value.int.base : undefined, fallback.int.base)),
      advance: clampAtZero(asFiniteNumber(value.int && isRecord(value.int) ? value.int.advance : undefined, fallback.int.advance)),
      ticks: clampAtZero(asFiniteNumber(value.int && isRecord(value.int) ? value.int.ticks : undefined, fallback.int.ticks))
    },
    fm: {
      base: clampAtZero(asFiniteNumber(value.fm && isRecord(value.fm) ? value.fm.base : undefined, fallback.fm.base)),
      advance: clampAtZero(asFiniteNumber(value.fm && isRecord(value.fm) ? value.fm.advance : undefined, fallback.fm.advance)),
      ticks: clampAtZero(asFiniteNumber(value.fm && isRecord(value.fm) ? value.fm.ticks : undefined, fallback.fm.ticks))
    },
    soc: {
      base: clampAtZero(asFiniteNumber(value.soc && isRecord(value.soc) ? value.soc.base : undefined, fallback.soc.base)),
      advance: clampAtZero(asFiniteNumber(value.soc && isRecord(value.soc) ? value.soc.advance : undefined, fallback.soc.advance)),
      ticks: clampAtZero(asFiniteNumber(value.soc && isRecord(value.soc) ? value.soc.ticks : undefined, fallback.soc.ticks))
    }
  }
}

export const parseCharacterImportJson = (json: string): Character => {
  let raw: unknown

  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('Character import is invalid.')
  }

  if (!isRecord(raw)) {
    throw new Error('Character import is invalid.')
  }

  const now = new Date().toISOString()
  const importedName = typeof raw.name === 'string' ? raw.name.trim() : ''

  const character: Character = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : nanoid(10),
    name: importedName,
    race: isRaceKey(raw.race) ? raw.race : defaultRace(),
    wounds: {
      current: clampAtZero(
        asFiniteNumber(isRecord(raw.wounds) ? raw.wounds.current : undefined, 10)
      ),
      max: clampAtZero(
        asFiniteNumber(isRecord(raw.wounds) ? raw.wounds.max : undefined, 10)
      )
    },
    fortune: normalizeImportedTrackedResource(raw.fortune, defaultFortune()),
    fate: normalizeImportedTrackedResource(raw.fate, defaultFate()),
    money: normalizeImportedMoney(raw.money),
    experience: normalizeImportedExperience(raw.experience),
    characteristics: normalizeCharacteristics(raw.characteristics),
    skills: normalizeImportedSkills(raw.skills),
    talents: normalizeImportedTalents(raw.talents),
    careers: normalizeImportedCareers(raw),
    inventory: normalizeInventory(raw.inventory),
    actions: clampAtZero(asFiniteNumber(raw.actions, 1)) || 1,
    actionsTicks: clampAtZero(asFiniteNumber(raw.actionsTicks, 0)),
    movement: clampAtZero(asFiniteNumber(raw.movement, 4)) || 4,
    magic: clampAtZero(asFiniteNumber(raw.magic, 0)),
    magicTicks: clampAtZero(asFiniteNumber(raw.magicTicks, 0)),
    bonusForceTicks: clampAtZero(asFiniteNumber(raw.bonusForceTicks, 0)),
    insanity: clampAtZero(asFiniteNumber(raw.insanity, 0)),
    createdAt: asIsoDate(raw.createdAt, now),
    updatedAt: asIsoDate(raw.updatedAt, now)
  }

  const normalized = patchResources(character, {
    woundsCurrent: character.wounds.current,
    woundsMax: character.wounds.max,
    fortuneCurrent: character.fortune.current,
    fortuneMax: character.fortune.max,
    fateCurrent: character.fate.current,
    fateMax: character.fate.max
  })

  const nextCharacter: Character = {
    ...normalized,
    money: character.money,
    experience: character.experience,
    inventory: character.inventory,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt
  }

  if (!isValidCharacter(nextCharacter)) {
    throw new Error('Character import is invalid.')
  }

  return nextCharacter
}
