<template>
	<dialog ref="dialogRef" class="modal modal-middle" @close="onClose">
		<div class="modal-box grim-modal-box p-6 sm:p-7">
			<button class="btn btn-circle min-h-11 min-w-11 grim-modal-close absolute right-3 top-3" @click="close" aria-label="Fermer">✕</button>
			<h3 class="grim-modal-title mb-4 text-center text-3xl">Créer mon personnage</h3>

			<form class="flex flex-col space-y-4" @submit.prevent="submit">
				<label class="form-control">
					<span class="label-text mr-2">Nom</span>
					<input v-model="name" type="text" class="input ui-critical-control" :aria-invalid="nameError ? 'true' : 'false'" :aria-errormessage="nameError ? 'character-name-error' : undefined" :aria-describedby="nameError ? 'character-name-error' : undefined" required maxlength="100" />
					<p v-if="nameError" id="character-name-error" class="label text-error text-xs">{{ nameError }}</p>
				</label>

				<label class="form-control">
					<span class="label-text mr-2">Race</span>
					<select v-model="race" class="select ui-critical-control" :aria-invalid="errorMessage ? 'true' : 'false'" required>
						<option v-for="opt in raceOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
					</select>
				</label>

				<label class="form-control">
					<span class="label-text mr-2">Genre</span>
					<select v-model="gender" class="select ui-critical-control" :aria-invalid="errorMessage ? 'true' : 'false'" required>
						<option v-for="opt in genderOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
					</select>
				</label>

				<div class="alert alert-info alert-soft text-sm">
					<span>Le nom et la race ne seront plus modifiables ensuite.</span>
				</div>

				<div v-if="errorMessage" role="alert" class="alert alert-error alert-soft text-sm">
					<span>{{ errorMessage }}</span>
				</div>

				<button type="submit" class="btn ui-critical-action w-full" :disabled="loading" :aria-busy="loading ? 'true' : 'false'">
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
import { computed, ref } from 'vue'
import type { CharacterGender, CharacterRace } from '../../types/character'
import { createCharacterForCampaign } from '../../services/charactersRepository'

const props = defineProps<{ campaignId: string; userId: string }>()
const emit = defineEmits<{ created: [characterId: string] }>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const submitAttempted = ref(false)
const name = ref('')
const race = ref<CharacterRace>('humain')
const gender = ref<CharacterGender>('masculin')

const nameError = computed(() => {
	if (!submitAttempted.value) {
		return null
	}

	return name.value.trim() ? null : 'Le nom du personnage est requis.'
})

const raceOptions: Array<{ value: CharacterRace; label: string }> = [
  { value: 'humain', label: 'Humain' },
  { value: 'nain', label: 'Nain' },
  { value: 'elfe', label: 'Elfe' },
  { value: 'halfling', label: 'Halfling' },
]

const genderOptions: Array<{ value: CharacterGender; label: string }> = [
  { value: 'masculin', label: 'Masculin' },
  { value: 'féminin', label: 'Féminin' },
]

function open(): void {
  errorMessage.value = null
	submitAttempted.value = false
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
	submitAttempted.value = false
}

async function submit(): Promise<void> {
  if (loading.value) return
	submitAttempted.value = true
	if (nameError.value) {
		return
	}
  loading.value = true
  errorMessage.value = null
  try {
    const characterId = await createCharacterForCampaign({
      userId: props.userId,
      campaignId: props.campaignId,
      name: name.value,
      race: race.value,
      gender: gender.value,
    })
    close()
    emit('created', characterId)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Création du personnage impossible.'
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
