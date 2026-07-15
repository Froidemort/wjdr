<template>
	<main class="mx-auto max-w-2xl p-4 sm:p-6 space-y-6">
		<AppCard title="Profil">
			<div class="space-y-6">
				<div class="space-y-3">
					<h3 class="font-semibold">Avatar</h3>
					<div class="flex flex-col md:flex-row md:items-end gap-4">
						<div class="flex-shrink-0">
							<div v-if="previewUrl || persistedAvatarUrl" class="avatar">
								<div class="bg-base-300 text-base-content rounded-full w-20 h-20 overflow-hidden flex items-center justify-center">
									<img :src="previewUrl || persistedAvatarUrl || ''" alt="Avatar utilisateur" class="w-full h-full object-cover" />
								</div>
							</div>
							<div v-else class="avatar placeholder">
								<div class="bg-base-300 text-base-content rounded-full w-20 h-20 flex items-center justify-center">
									<UserCircle class="h-10 w-10" />
								</div>
							</div>
						</div>
						<div class="flex-1 w-full">
							<label class="form-control w-full">
								<div class="label">
									<span class="label-text">Changer votre avatar</span>
									<span class="label-text-alt">Max 5MB, PNG/JPG</span>
								</div>
								<input
									type="file"
									class="file-input file-input-sm w-full"
									accept="image/png,image/jpeg"
									@change="onAvatarChange"
									:disabled="uploadingAvatar"
								/>
							</label>
							<div v-if="avatarError" class="alert alert-error alert-sm mt-2">
								<span>{{ avatarError }}</span>
							</div>
							<div v-if="uploadingAvatar" class="mt-2 flex items-center gap-2">
								<span class="loading loading-spinner loading-sm" />
								<span class="text-sm">Upload en cours...</span>
							</div>
						</div>
					</div>
				</div>

				<div class="divider" />

				<div class="space-y-3">
					<h3 class="font-semibold">Username</h3>
					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">Votre username</span>
						</label>
						<div class="flex flex-col gap-2 sm:flex-row">
							<input v-model="username" type="text" class="input input-bordered w-full" maxlength="20" placeholder="username" />
							<button class="btn btn-accent" :disabled="savingUsername" @click="saveUsername">
								<span v-if="savingUsername" class="loading loading-spinner loading-sm" aria-hidden="true" />
								Enregistrer
							</button>
						</div>
						<div v-if="usernameError" role="alert" class="alert alert-error alert-soft mt-2">
							<span>{{ usernameError }}</span>
						</div>
						<div v-if="usernameSuccess" role="status" class="alert alert-success alert-soft mt-2">
							<span>{{ usernameSuccess }}</span>
						</div>
					</div>
				</div>

				<div class="divider" />

				<div class="space-y-3">
					<h3 class="font-semibold">Email</h3>
					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">Votre email actuel</span>
						</label>
						<input type="email" :value="email" class="input input-bordered w-full" disabled />
					</div>
					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">Nouvel email</span>
						</label>
						<input v-model="newEmail" type="email" class="input input-bordered w-full" placeholder="nouvel-email@exemple.com" />
					</div>
					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">Mot de passe actuel</span>
						</label>
						<input v-model="emailCurrentPassword" type="password" class="input input-bordered w-full" placeholder="••••••••" />
					</div>
					<div class="flex justify-end">
						<button class="btn btn-accent" :disabled="updatingEmail" @click="changeEmail">
							<span v-if="updatingEmail" class="loading loading-spinner loading-sm" aria-hidden="true" />
							Modifier l email
						</button>
					</div>
					<div v-if="emailError" role="alert" class="alert alert-error alert-soft">
						<span>{{ emailError }}</span>
					</div>
					<div v-if="emailSuccess" role="status" class="alert alert-success alert-soft">
						<span>{{ emailSuccess }}</span>
					</div>
				</div>

				<div class="divider" />

				<div class="space-y-3">
					<h3 class="font-semibold">Mot de passe</h3>
					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">Ancien mot de passe</span>
						</label>
						<input v-model="passwordCurrent" type="password" placeholder="••••••••" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">Nouveau mot de passe</span>
						</label>
						<input v-model="passwordNext" type="password" placeholder="••••••••" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">Confirmer le mot de passe</span>
						</label>
						<input v-model="passwordConfirm" type="password" placeholder="••••••••" class="input input-bordered w-full" />
					</div>
					<button class="btn btn-accent w-full" :disabled="updatingPassword" @click="changePassword">
						<span v-if="updatingPassword" class="loading loading-spinner loading-sm" aria-hidden="true" />
						Changer le mot de passe
					</button>
					<div v-if="passwordError" role="alert" class="alert alert-error alert-soft">
						<span>{{ passwordError }}</span>
					</div>
					<div v-if="passwordSuccess" role="status" class="alert alert-success alert-soft">
						<span>{{ passwordSuccess }}</span>
					</div>
				</div>
			</div>
		</AppCard>

		<div class="flex justify-start">
			<router-link to="/" class="btn btn-ghost btn-sm">
				<ChevronLeft class="h-5 w-5" />
				Retour
			</router-link>
		</div>
	</main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ChevronLeft, UserCircle } from '@lucide/vue'
import AppCard from '../components/AppCard.vue'
import { useAuthStore } from '../../stores/auth'
import {
	getProfileSettings,
	reauthenticateWithPassword,
	updateAccountPassword,
	updateProfileEmail,
	updateProfileUsername,
	uploadProfileAvatar
} from '../../repositories/profileRepository'

const authStore = useAuthStore()

const email = ref('')
const username = ref('')
const newEmail = ref('')
const emailCurrentPassword = ref('')
const passwordCurrent = ref('')
const passwordNext = ref('')
const passwordConfirm = ref('')

const savingUsername = ref(false)
const updatingEmail = ref(false)
const updatingPassword = ref(false)

const usernameError = ref('')
const usernameSuccess = ref('')
const emailError = ref('')
const emailSuccess = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')

const uploadingAvatar = ref(false)
const avatarError = ref('')
const previewUrl = ref<string | null>(null)
const persistedAvatarUrl = ref<string | null>(null)

async function loadProfile(): Promise<void> {
	if (!authStore.user?.id) {
		return
	}

	const profile = await getProfileSettings(authStore.user.id)
	username.value = profile.username
	email.value = profile.email
	newEmail.value = profile.email
	persistedAvatarUrl.value = profile.avatarUrl
}

async function saveUsername(): Promise<void> {
	if (!authStore.user?.id || savingUsername.value) {
		return
	}

	savingUsername.value = true
	usernameError.value = ''
	usernameSuccess.value = ''
	try {
		const nextUsername = await updateProfileUsername(authStore.user.id, username.value)
		username.value = nextUsername
		await authStore.refreshDisplayName()
		usernameSuccess.value = 'Username mis a jour.'
	} catch (error) {
		usernameError.value = error instanceof Error ? error.message : 'Mise a jour du username impossible.'
	} finally {
		savingUsername.value = false
	}
}

async function changeEmail(): Promise<void> {
	if (!authStore.user?.id || updatingEmail.value) {
		return
	}

	if (!newEmail.value.trim()) {
		emailError.value = 'Veuillez saisir un nouvel email.'
		return
	}

	if (!emailCurrentPassword.value) {
		emailError.value = 'Veuillez confirmer votre mot de passe actuel.'
		return
	}

	updatingEmail.value = true
	emailError.value = ''
	emailSuccess.value = ''
	try {
		await reauthenticateWithPassword(email.value, emailCurrentPassword.value)
		const nextEmail = await updateProfileEmail(authStore.user.id, newEmail.value)
		email.value = nextEmail
		newEmail.value = nextEmail
		emailCurrentPassword.value = ''
		emailSuccess.value = 'Email mis a jour. Verifiez votre boite de reception.'
	} catch (error) {
		emailError.value = error instanceof Error ? error.message : 'Mise a jour de l email impossible.'
	} finally {
		updatingEmail.value = false
	}
}

async function changePassword(): Promise<void> {
	if (updatingPassword.value) {
		return
	}

	if (!email.value) {
		passwordError.value = 'Email introuvable pour verifier votre session.'
		return
	}

	if (!passwordCurrent.value || !passwordNext.value || !passwordConfirm.value) {
		passwordError.value = 'Veuillez completer tous les champs mot de passe.'
		return
	}

	if (passwordNext.value !== passwordConfirm.value) {
		passwordError.value = 'La confirmation du nouveau mot de passe ne correspond pas.'
		return
	}

	if (passwordNext.value.length < 8) {
		passwordError.value = 'Le nouveau mot de passe doit contenir au moins 8 caracteres.'
		return
	}

	updatingPassword.value = true
	passwordError.value = ''
	passwordSuccess.value = ''
	try {
		await reauthenticateWithPassword(email.value, passwordCurrent.value)
		await updateAccountPassword(passwordNext.value)
		passwordCurrent.value = ''
		passwordNext.value = ''
		passwordConfirm.value = ''
		passwordSuccess.value = 'Mot de passe modifie.'
	} catch (error) {
		passwordError.value = error instanceof Error ? error.message : 'Changement de mot de passe impossible.'
	} finally {
		updatingPassword.value = false
	}
}

onMounted(async () => {
	try {
		await loadProfile()
	} catch (error) {
		usernameError.value = error instanceof Error ? error.message : 'Chargement du profil impossible.'
	}
})

async function onAvatarChange(event: Event): Promise<void> {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]

	if (!file) {
		return
	}

	if (file.size > 5 * 1024 * 1024) {
		avatarError.value = 'Le fichier depasse 5MB'
		return
	}

	if (!['image/png', 'image/jpeg'].includes(file.type)) {
		avatarError.value = 'Seuls PNG et JPG sont acceptes'
		return
	}

	avatarError.value = ''
	uploadingAvatar.value = true

	try {
		if (!authStore.user?.id) {
			throw new Error('Utilisateur non connecte.')
		}

		previewUrl.value = URL.createObjectURL(file)
		const uploadedAvatarUrl = await uploadProfileAvatar(authStore.user.id, file)
		persistedAvatarUrl.value = uploadedAvatarUrl
		await authStore.refreshDisplayName()
		uploadingAvatar.value = false
	} catch (err) {
		avatarError.value = err instanceof Error ? err.message : 'Erreur upload'
		if (!persistedAvatarUrl.value) {
			previewUrl.value = null
		}
		uploadingAvatar.value = false
	}
}
</script>
