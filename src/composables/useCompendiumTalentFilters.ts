import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { normalizeSearchText } from '../utils/searchText'

interface FilterableTalent {
  name: string
  specialization: string | null
  description: string | null
}

export function useCompendiumTalentFilters<TTalent extends FilterableTalent>(options: {
  talents: Ref<TTalent[]>
}) {
  const searchQuery = ref('')
  const onlySpecialized = ref(false)

  const activeFilterCount = computed(
    () => (searchQuery.value.trim() ? 1 : 0) + (onlySpecialized.value ? 1 : 0)
  )

  function resetFilters(): void {
    searchQuery.value = ''
    onlySpecialized.value = false
  }

  const filteredTalents = computed(() => {
    const query = normalizeSearchText(searchQuery.value.trim())

    return options.talents.value.filter((talent) => {
      if (onlySpecialized.value && !talent.specialization) return false
      if (!query) return true

      const haystack = normalizeSearchText(
        `${talent.name} ${talent.specialization ?? ''} ${talent.description ?? ''}`
      )
      return haystack.includes(query)
    })
  })

  return { searchQuery, onlySpecialized, filteredTalents, activeFilterCount, resetFilters }
}
