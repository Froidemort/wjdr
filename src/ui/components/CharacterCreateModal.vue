<template>
	<dialog ref="dialogRef" class="modal modal-middle" @close="onClose">
		<div class="modal-box border border-base-300 p-6">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="close">✕</button>
			<h3 class="mb-4 text-center text-2xl font-semibold">Créer mon personnage</h3>

			<form class="flex flex-col space-y-4" @submit.prevent="submit">
				<label class="form-control">
					<span class="label-text mr-2">Nom</span>
					<input v-model="name" type="text" class="input" required maxlength="100" />
				</label>

				<label class="form-control">
					<span class="label-text mr-2">Race</span>
					<select v-model="race" class="select" required>
						<option v-for="opt in raceOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
					</select>
				</label>

				<label class="form-control">
					<span class="label-text mr-2">Genre</span>
					<select v-model="gender" class="select" required>
						<option v-for="opt in genderOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
					</select>
				</label>

				<div class="alert alert-info alert-soft text-sm">
					<span>Le nom et la race ne seront plus modifiables ensuite.</span>
				</div>

				<div v-if="errorMessage" role="alert" class="alert alert-error alert-soft text-sm">
					<span>{{ errorMessage }}</span>
				</div>

				<button type="submit" class="btn btn-accent w-full" :disabled="loading">
					<span v-if="loading" class="loading loading-spinner loading-sm" aria-hidden="true" />
					<span>Valider</span>
				</button>
			</form>
		</div>

		<form method="dialog" class="modal-backdrop">
			<button>Fermer</button>
		</form>
	</dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createCharacterForSession, type CharacterRace, type CharacterGender } from '../../repositories/charactersRepository'

const props = defineProps<{ sessionId: string; userId: string }>()
const emit = defineEmits<{ created: [characterId: string] }>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const name = ref('')
const race = ref<CharacterRace>('humain')
const gender = ref<CharacterGender>('masculin')

const raceOptions: Array<{ value: CharacterRace; label: string }> = [
	{ value: 'humain', label: 'Humain' },
	{ value: 'nain', label: 'Nain' },
	{ value: 'elfe', label: 'Elfe' },
	{ value: 'halfling', label: 'Halfling' }
]

const genderOptions: Array<{ value: CharacterGender; label: string }> = [
	{ value: 'masculin', label: 'Masculin' },
	{ value: 'féminin', label: 'Féminin' }
]

function open(): void {
	errorMessage.value = null
	dialogRef.value?.showModal()
}

function close(): void {
	if (dialogRef.value?.open) dialogRef.value.close()
}

function onClose(): void {
	name.value = ''
	race.value = 'humain'
	gender.value = 'masculin'
	errorMessage.value = null
}

async function submit(): Promise<void> {
	if (loading.value) return
	loading.value = true
	errorMessage.value = null
	try {
		const characterId = await createCharacterForSession({
			userId: props.userId,
			sessionId: props.sessionId,
			name: name.value,
			race: race.value,
			gender: gender.value
		})
		close()
		emit('created', characterId)
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Création du personnage impossible.'
	} finally {
		loading.value = false
	}
}

defineExpose({ open })
</script>
