import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '../db/supabase'
import type { CatalogItem, CatalogTableName } from '../types/catalog'
import type { CareerPathRow } from '../types/db'

interface ReferenceDataState {
  careers: CatalogItem[]
  skills: CatalogItem[]
  talents: CatalogItem[]
  weapons: CatalogItem[]
  armors: CatalogItem[]
  careerPaths: Map<string, CatalogItem[]>
}

const EMPTY_ITEM: CatalogItem = {
  id: '',
  name: '',
  specialization: null,
  description: null,
  encumbrance: null,
  damageFormula: null,
  armorPoints: null,
}

function mapCatalogItem(row: Record<string, unknown>): CatalogItem {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    specialization: typeof row.specialization === 'string' ? row.specialization : null,
    description: typeof row.description === 'string' ? row.description : null,
    encumbrance:
      typeof row.encumbrance === 'number'
        ? row.encumbrance
        : typeof row.encumbrance === 'string' && row.encumbrance.trim() !== ''
          ? Number(row.encumbrance)
          : null,
    damageFormula:
      typeof row.damage_formula === 'string' ? row.damage_formula : typeof row.damageFormula === 'string' ? row.damageFormula : null,
    armorPoints:
      typeof row.armor_points === 'number'
        ? row.armor_points
        : typeof row.armor_points === 'string' && row.armor_points.trim() !== ''
          ? Number(row.armor_points)
          : null,
  }
}

function clampCatalogList(entries: unknown[]): CatalogItem[] {
  return entries
    .map((entry) => mapCatalogItem(entry as Record<string, unknown>))
    .filter((entry) => entry.id && entry.name)
}

async function loadCareerPathsMap(careers: CatalogItem[]): Promise<Map<string, CatalogItem[]>> {
  const { data, error } = await supabase
    .from('career_paths')
    .select('from_career_id, to_career_id')
    .order('from_career_id', { ascending: true })

  if (error) {
    throw error
  }

  const nextCareerPaths = new Map<string, CatalogItem[]>()
  const pathRows = (data ?? []) as CareerPathRow[]

  for (const path of pathRows) {
    if (!path.from_career_id || !path.to_career_id) {
      continue
    }

    const targetCareer = careers.find((career) => career.id === path.to_career_id)
    if (!targetCareer) {
      continue
    }

    const existing = nextCareerPaths.get(path.from_career_id) ?? []
    nextCareerPaths.set(path.from_career_id, [...existing, targetCareer])
  }

  return nextCareerPaths
}

export const useReferenceDataStore = defineStore('referenceData', () => {
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const state = ref<ReferenceDataState>({
    careers: [],
    skills: [],
    talents: [],
    weapons: [],
    armors: [],
    careerPaths: new Map(),
  })

  const isReady = computed(() => initialized.value)

  async function init(): Promise<void> {
    if (initialized.value) {
      return
    }

    if (loading.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const [careersResult, skillsResult, talentsResult, weaponsResult, armorsResult, pathsResult] =
        await Promise.all([
          supabase.from('careers').select('id, name').order('name', { ascending: true }),
          supabase.from('skills').select('id, name, specialization, description').order('name', { ascending: true }),
          supabase.from('talents').select('id, name, specialization, description').order('name', { ascending: true }),
          supabase.from('weapons').select('id, name, description, encumbrance, damage_formula').order('name', { ascending: true }),
          supabase.from('armors').select('id, name, description, encumbrance, armor_points').order('name', { ascending: true }),
          supabase.from('career_paths').select('from_career_id, to_career_id'),
        ])

      if (careersResult.error) {
        throw careersResult.error
      }
      if (skillsResult.error) {
        throw skillsResult.error
      }
      if (talentsResult.error) {
        throw talentsResult.error
      }
      if (weaponsResult.error) {
        throw weaponsResult.error
      }
      if (armorsResult.error) {
        throw armorsResult.error
      }
      if (pathsResult.error) {
        throw pathsResult.error
      }

      const nextCareers = clampCatalogList(careersResult.data ?? [])
      const nextSkills = clampCatalogList(skillsResult.data ?? [])
      const nextTalents = clampCatalogList(talentsResult.data ?? [])
      const nextWeapons = clampCatalogList(weaponsResult.data ?? [])
      const nextArmors = clampCatalogList(armorsResult.data ?? [])
      const nextCareerPaths = await loadCareerPathsMap(nextCareers)

      state.value = {
        careers: nextCareers,
        skills: nextSkills,
        talents: nextTalents,
        weapons: nextWeapons,
        armors: nextArmors,
        careerPaths: nextCareerPaths,
      }
      initialized.value = true
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Chargement des données de référence impossible.'
      throw caughtError
    } finally {
      loading.value = false
    }
  }

  async function search(table: CatalogTableName, query: string): Promise<CatalogItem[]> {
    await init().catch(() => undefined)

    const trimmed = query.trim()
    if (!trimmed) {
      return []
    }

    const source = table === 'careers' ? state.value.careers : table === 'skills' ? state.value.skills : table === 'talents' ? state.value.talents : table === 'weapons' ? state.value.weapons : state.value.armors

    const needle = trimmed.toLocaleLowerCase('fr')

    return source.filter((entry) => {
      const name = entry.name.toLocaleLowerCase('fr')
      const specialization = entry.specialization?.toLocaleLowerCase('fr') ?? ''
      return name.includes(needle) || specialization.includes(needle)
    })
  }

  async function getCareerPathsByFromCareerId(careerId: string): Promise<CatalogItem[]> {
    await init().catch(() => undefined)

    if (state.value.careerPaths.has(careerId)) {
      return [...state.value.careerPaths.get(careerId) ?? []].sort((left, right) =>
        left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' })
      )
    }

    const fallback = await loadCareerPathsMap(state.value.careers)
    const items = fallback.get(careerId) ?? []
    state.value.careerPaths = fallback
    return [...items].sort((left, right) => left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }))
  }

  async function getCareerCharacteristicsByCareerId(_careerId: string): Promise<CatalogItem[]> {
    return [EMPTY_ITEM]
  }

  return {
    init,
    search,
    getCareerPathsByFromCareerId,
    getCareerCharacteristicsByCareerId,
    isReady,
    loading,
    error,
    careers: computed(() => state.value.careers),
    skills: computed(() => state.value.skills),
    talents: computed(() => state.value.talents),
    weapons: computed(() => state.value.weapons),
    armors: computed(() => state.value.armors),
    careerPaths: computed(() => state.value.careerPaths),
  }
})
