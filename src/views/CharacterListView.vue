<template>
	<main class="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-2xl font-semibold">Mes personnages</h1>
    </header>

    <section class="space-y-3">
      <div class="grid gap-2 sm:grid-cols-[auto,1fr]">
        <div class="join join-vertical sm:join-horizontal">
          <button class="btn btn-xs join-item" :class="raceFilter === 'all' ? 'btn-active' : ''" @click="raceFilter = 'all'">Toutes races</button>
          <button class="btn btn-xs join-item" :class="raceFilter === 'humain' ? 'btn-active' : ''" @click="raceFilter = 'humain'">Humains</button>
          <button class="btn btn-xs join-item" :class="raceFilter === 'nain' ? 'btn-active' : ''" @click="raceFilter = 'nain'">Nains</button>
          <button class="btn btn-xs join-item" :class="raceFilter === 'elfe' ? 'btn-active' : ''" @click="raceFilter = 'elfe'">Elfes</button>
          <button class="btn btn-xs join-item" :class="raceFilter === 'halfling' ? 'btn-active' : ''" @click="raceFilter = 'halfling'">Halflings</button>
        </div>
        <div class="join join-vertical sm:join-horizontal">
          <button class="btn btn-xs join-item" :class="genderFilter === 'all' ? 'btn-active' : ''" @click="genderFilter = 'all'">Tous genres</button>
          <button class="btn btn-xs join-item" :class="genderFilter === 'masculin' ? 'btn-active' : ''" @click="genderFilter = 'masculin'">Masculins</button>
          <button class="btn btn-xs join-item" :class="genderFilter === 'féminin' ? 'btn-active' : ''" @click="genderFilter = 'féminin'">Féminins</button>
        </div>
        <SearchInput v-model="searchQuery" placeholder="Filtrer par nom" aria-label="Filtrer les personnages par nom" />
      </div>
    </section>

    <DataGrid
      :items="filteredCharacters"
      :loading="loading"
      :error="errorMessage"
      empty-message="Aucun personnage pour ce filtre."
      grid-class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
    >
			<template #default="{ items }">
				<CharacterSummaryCard
					v-for="character in items"
					:key="character.id"
					:character="character"
          action-label="Ouvrir"
          compact
				>
				</CharacterSummaryCard>
			</template>
		</DataGrid>

		<PageFooter back-to="/" back-label="Menu principal" />
	</main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { listCharactersForUser } from '../services/charactersRepository'
import { useAuthStore } from '../stores/auth'
import type { CharacterSummary } from '../types/domain'
import CharacterSummaryCard from '../components/ui/CharacterSummaryCard.vue'
import DataGrid from '../components/ui/DataGrid.vue'
import PageFooter from '../components/ui/PageFooter.vue'
import SearchInput from '../components/ui/SearchInput.vue'
import { useLoadingState } from '../composables/useLoadingState'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'

const authStore = useAuthStore()
const {
  data: characters,
  loading,
  error: errorMessage,
  execute,
} = useLoadingState<CharacterSummary[]>({ fallbackValue: [] })
const { subscribe, unsubscribe } = useRealtimeChannels(
  () => {
    void loadCharacters()
  },
  { debounceMs: 400 }
)

const charactersList = computed(() => characters.value ?? [])
const searchQuery = ref('')
const raceFilter = ref<'all' | 'humain' | 'nain' | 'elfe' | 'halfling'>('all')
const genderFilter = ref<'all' | 'masculin' | 'féminin'>('all')

const filteredCharacters = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return charactersList.value.filter((character) => {
    const race = character.race.trim().toLowerCase()
    const matchesRace = raceFilter.value === 'all' || race === raceFilter.value
    const matchesGender = genderFilter.value === 'all' || character.gender === genderFilter.value
    const matchesQuery =
      query.length === 0 || character.name.toLowerCase().includes(query)

    return matchesRace && matchesGender && matchesQuery
  })
})

async function loadCharacters(): Promise<void> {
  if (!authStore.user?.id) {
    characters.value = []
    return
  }

  await execute(() => listCharactersForUser(authStore.user!.id))
}

watch(
  () => authStore.user?.id,
  (userId) => {
    if (!userId) {
      characters.value = []
      unsubscribe()
      return
    }

    void loadCharacters()
    subscribe(`characters-list-${userId}`, [
      { table: 'characters', filter: `user_id=eq.${userId}` },
    ])
  },
  { immediate: true }
)
</script>

<style scoped>
	.btn-active {
		background-color: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-accent-content);
	}
</style>