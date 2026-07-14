<template>
	<AppCard title="Accès restreint">
		<div class="space-y-4">
			<p class="text-sm opacity-80">
				Cette session ne vous est pas encore ouverte. Vous pouvez envoyer une demande au Maître du Jeu,
				qui pourra l'accepter ou la refuser.
			</p>

			<div class="flex flex-wrap gap-2">
				<button
					class="btn btn-sm"
					:class="requesting ? 'btn-disabled' : ''"
					@click="sendRequest"
				>
					<span v-if="requesting" class="loading loading-spinner loading-xs" aria-hidden="true" />
					Demander à rejoindre
				</button>
				<router-link class="btn btn-sm btn-ghost" to="/">
					<ChevronLeft class="h-4 w-4" />
					Revenir à l'accueil
				</router-link>
			</div>

			<div v-if="successMessage" role="status" class="alert alert-success alert-soft text-sm">
				<span>{{ successMessage }}</span>
			</div>
			<div v-if="errorMessage" role="alert" class="alert alert-error alert-soft text-sm">
				<span>{{ errorMessage }}</span>
			</div>
		</div>
	</AppCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft } from '@lucide/vue'
import AppCard from './AppCard.vue'
import { requestJoinSession } from '../../repositories/notificationsRepository'

const props = defineProps<{ sessionId: string; userId: string }>()

const requesting = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

async function sendRequest(): Promise<void> {
	if (requesting.value || successMessage.value) return
	requesting.value = true
	successMessage.value = null
	errorMessage.value = null
	try {
		await requestJoinSession(props.sessionId, props.userId)
		successMessage.value = "Ta demande a été envoyée au Maître du Jeu ! Que Sigmar t'accorde sa faveur."
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Demande impossible.'
	} finally {
		requesting.value = false
	}
}
</script>
