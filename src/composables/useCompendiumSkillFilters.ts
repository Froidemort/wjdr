import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { normalizeSearchText } from '../utils/searchText'
import { sortStatsByCharacteristicOrder } from '../utils/characterSheet'

export type SkillTypeFilter = 'all' | 'basic' | 'advanced'

interface FilterableSkill {
  name: string
  specialization: string | null
  description: string | null
  isBasic: boolean
  statCode: string
}

export function useCompendiumSkillFilters<TSkill extends FilterableSkill>(options: {
  skills: Ref<TSkill[]>
}) {
  const searchQuery = ref('')
  const typeFilter = ref<SkillTypeFilter>('all')
  const selectedCharacteristics = ref(new Set<string>())

  const characteristics = computed(() => {
    const counts = new Map<string, number>()
    for (const skill of options.skills.value) {
      counts.set(skill.statCode, (counts.get(skill.statCode) ?? 0) + 1)
    }
    return sortStatsByCharacteristicOrder(
      Array.from(counts, ([statCode, count]) => ({ statCode, count }))
    ).map(({ statCode, count }) => ({ code: statCode, count }))
  })

  function toggleCharacteristic(code: string): void {
    const next = new Set(selectedCharacteristics.value)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    selectedCharacteristics.value = next
  }

  function isCharacteristicSelected(code: string): boolean {
    return selectedCharacteristics.value.has(code)
  }

  const activeFilterCount = computed(() => {
    let count = selectedCharacteristics.value.size
    if (searchQuery.value.trim()) count += 1
    if (typeFilter.value !== 'all') count += 1
    return count
  })

  function resetFilters(): void {
    searchQuery.value = ''
    typeFilter.value = 'all'
    selectedCharacteristics.value = new Set()
  }

  const filteredSkills = computed(() => {
    const query = normalizeSearchText(searchQuery.value.trim())

    return options.skills.value.filter((skill) => {
      if (typeFilter.value === 'basic' && !skill.isBasic) return false
      if (typeFilter.value === 'advanced' && skill.isBasic) return false
      if (selectedCharacteristics.value.size > 0 && !selectedCharacteristics.value.has(skill.statCode)) {
        return false
      }
      if (!query) return true

      const haystack = normalizeSearchText(
        `${skill.name} ${skill.specialization ?? ''} ${skill.description ?? ''}`
      )
      return haystack.includes(query)
    })
  })

  return {
    searchQuery,
    typeFilter,
    selectedCharacteristics,
    characteristics,
    filteredSkills,
    activeFilterCount,
    toggleCharacteristic,
    isCharacteristicSelected,
    resetFilters,
  }
}
