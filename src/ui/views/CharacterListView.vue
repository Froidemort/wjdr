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
				<AppCard v-for="character in items" :key="character.id" :title="character.name">
					<div class="flex items-center gap-2">
						<p class="text-sm opacity-80">{{ character.race }}</p>
						<component 
							:is="character.gender === 'masculin' ? Mars : Venus" 
							class="h-4 w-4 opacity-75"
						/>
						<p class="text-sm opacity-80">· Carrière {{ character.careerName || character.careerId }}</p>
					</div>

					<StatBadges :stats="[
						{ label: 'B', value: `${character.pvCurrent}/${character.pvMax}` },
						{ label: 'Fortune', value: `${character.fortuneCurrent}/${character.fortuneMax}` },
						{ label: 'Destin', value: character.destinyCurrent },
						{ label: 'XP', value: `${character.xpAvailable}/${character.xpTotal}` }
					]" />

					<div class="card-actions mt-4 justify-end">
						<router-link class="btn btn-sm" :to="`/characters/${character.id}`">Ouvrir</router-link>
					</div>
				</AppCard>
			</template>
		</DataGrid>

		<PageFooter back-to="/" back-label="Menu principal" />
	</main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Mars, Venus } from '@lucide/vue'
import AppCard from '../components/AppCard.vue'
import DataGrid from '../components/DataGrid.vue'
import StatBadges from '../components/StatBadges.vue'
import PageFooter from '../components/PageFooter.vue'
import { useAuthStore } from '../../stores/auth'
import { useLoadingState } from '../composables/useLoadingState'
import { listCharactersForUser } from '../../repositories/charactersRepository'
import type { CharacterSummary } from '../../types/domain'

const authStore = useAuthStore()
const { data: characters, loading, error: errorMessage, execute } = useLoadingState<CharacterSummary[]>({ fallbackValue: [] })

const charactersList = computed(() => characters.value ?? [])

async function loadCharacters(): Promise<void> {
	if (!authStore.user?.id) {
		characters.value = []
		return
	}

	await execute(() => listCharactersForUser(authStore.user!.id))
}

onMounted(loadCharacters)
</script>
