<template>
	<main class="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
		<header class="flex items-center justify-between">
			<h1 class="text-2xl font-semibold">Mes personnages</h1>
		</header>

		<DataGrid
			:items="charactersList"
			:loading="loading"
			:error="errorMessage"
			empty-message="Aucun personnage disponible."
			grid-class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
		>
			<template #default="{ items }">
				<CharacterSummaryCard
					v-for="character in items"
					:key="character.id"
					:character="character"
					action-label="Ouvrir"
				>
				</CharacterSummaryCard>
			</template>
		</DataGrid>

		<PageFooter back-to="/" back-label="Menu principal" />
	</main>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import CharacterSummaryCard from '../components/CharacterSummaryCard.vue'
import DataGrid from '../components/DataGrid.vue'
import PageFooter from '../components/PageFooter.vue'
import { useAuthStore } from '../../stores/auth'
import { useLoadingState } from '../composables/useLoadingState'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'
import { listCharactersForUser } from '../../repositories/charactersRepository'
import type { CharacterSummary } from '../../types/domain'

const authStore = useAuthStore()
const { data: characters, loading, error: errorMessage, execute } = useLoadingState<CharacterSummary[]>({ fallbackValue: [] })
const { subscribe, unsubscribe } = useRealtimeChannels(() => {
	void loadCharacters()
}, { debounceMs: 400 })

const charactersList = computed(() => characters.value ?? [])

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
			{ table: 'characters', filter: `user_id=eq.${userId}` }
		])
	},
	{ immediate: true }
)
</script>
