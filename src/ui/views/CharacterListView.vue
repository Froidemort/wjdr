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
				<AppCard
					v-for="character in items"
					:key="character.id"
					:title="character.name"
					:avatar-url="character.ownerAvatarUrl"
					avatar-alt="Avatar du joueur"
				>
					<div class="flex items-center gap-2">
						<p class="text-sm opacity-80">{{ character.race }}</p>
						<component 
							:is="character.gender === 'masculin' ? Mars : Venus" 
							class="h-4 w-4 opacity-75"
						/>
						<p class="text-sm opacity-80">{{ character.gender === 'masculin' ? 'Masculin' : 'Feminin' }}</p>
						<p class="text-sm opacity-80">· Carrière {{ character.careerName || character.careerId }}</p>
					</div>

					<div class="mt-3 grid gap-2 text-sm">
						<div class="flex items-center gap-2">
							<Heart class="h-4 w-4 text-error" />
							<span class="font-medium">Vie</span>
							<span class="opacity-80">{{ character.pvCurrent }}/{{ character.pvMax }}</span>
						</div>
						<div class="flex items-center gap-2">
							<Clover class="h-4 w-4 text-success" />
							<span class="font-medium">Fortune</span>
							<span class="opacity-80">{{ character.fortuneCurrent }}/{{ character.fortuneMax }}</span>
						</div>
						<div class="flex items-center gap-2">
							<WandSparkles class="h-4 w-4 text-accent" />
							<span class="font-medium">Destin</span>
							<span class="opacity-80">{{ character.destinyCurrent }}</span>
						</div>
					</div>

					<div class="card-actions mt-4 justify-end">
						<router-link class="btn btn-sm btn-accent" :to="`/characters/${character.id}`">Ouvrir</router-link>
					</div>
				</AppCard>
			</template>
		</DataGrid>

		<PageFooter back-to="/" back-label="Menu principal" />
	</main>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Clover, Heart, Mars, Venus, WandSparkles } from '@lucide/vue'
import AppCard from '../components/AppCard.vue'
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
