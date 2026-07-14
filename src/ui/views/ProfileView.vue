<template>
	<main class="mx-auto max-w-2xl p-4 sm:p-6 space-y-6">
		<AppCard title="Profil">
			<div class="space-y-6">
				<!-- Avatar Section -->
				<div class="space-y-3">
					<h3 class="font-semibold">Avatar</h3>
					<div class="flex flex-col md:flex-row md:items-end gap-4">
						<div class="flex-shrink-0">
							<div v-if="previewUrl" class="avatar">
								<div class="bg-base-300 text-base-content rounded-full w-20 h-20 overflow-hidden flex items-center justify-center">
									<img :src="previewUrl" alt="Preview avatar" class="w-full h-full object-cover" />
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
								<span class="loading loading-spinner loading-sm"></span>
								<span class="text-sm">Upload en cours...</span>
							</div>
						</div>
					</div>
				</div>

				<div class="divider"></div>

				<!-- Email Section -->
				<div class="space-y-3">
					<h3 class="font-semibold">Email</h3>
					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">Votre email actuel</span>
						</label>
						<div class="flex gap-2">
							<input 
								type="email" 
								:value="email"
								class="input input-bordered flex-1" 
								disabled
							/>
							<button 
								class="btn btn-outline"
								disabled
								title="Modification désactivée pour le moment"
							>
								Modifier
							</button>
						</div>
						<div class="label">
							<span class="label-text-alt text-warning">Fonction bientôt disponible</span>
						</div>
					</div>
				</div>

				<div class="divider"></div>

				<!-- Password Section -->
				<div class="space-y-3">
					<h3 class="font-semibold">Mot de passe</h3>
					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">Ancien mot de passe</span>
						</label>
						<input 
							type="password" 
							placeholder="••••••••"
							class="input input-bordered w-full" 
							disabled
						/>
					</div>
					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">Nouveau mot de passe</span>
						</label>
						<input 
							type="password" 
							placeholder="••••••••"
							class="input input-bordered w-full" 
							disabled
						/>
					</div>
					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">Confirmer le mot de passe</span>
						</label>
						<input 
							type="password" 
							placeholder="••••••••"
							class="input input-bordered w-full" 
							disabled
						/>
					</div>
					<button 
						class="btn btn-outline w-full"
						disabled
						title="Modification désactivée pour le moment"
					>
						Changer le mot de passe
					</button>
					<div class="label">
						<span class="label-text-alt text-warning">Fonction bientôt disponible</span>
					</div>
				</div>
			</div>
		</AppCard>

		<!-- Back Button -->
		<div class="flex justify-start">
			<router-link to="/" class="btn btn-ghost btn-sm">
				<ChevronLeft class="h-5 w-5" />
				Retour
			</router-link>
		</div>
	</main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { ChevronLeft, UserCircle } from '@lucide/vue'
import AppCard from '../components/AppCard.vue'

const authStore = useAuthStore()

const email = ref('')
const uploadingAvatar = ref(false)
const avatarError = ref('')
const previewUrl = ref<string | null>(null)

onMounted(async () => {
	if (authStore.user?.email) {
		email.value = authStore.user.email
	}
})

async function onAvatarChange(event: Event): Promise<void> {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]

	if (!file) {
		return
	}

	// Validation
	if (file.size > 5 * 1024 * 1024) {
		avatarError.value = 'Le fichier dépasse 5MB'
		return
	}

	if (!['image/png', 'image/jpeg'].includes(file.type)) {
		avatarError.value = 'Seuls PNG et JPG sont acceptés'
		return
	}

	avatarError.value = ''
	uploadingAvatar.value = true

	try {
		// Générer preview URL
		previewUrl.value = URL.createObjectURL(file)

		// TODO: Implémenter l'upload vers Supabase Storage
		// Pour le moment, c'est un placeholder
		console.log('Avatar upload:', file.name)
		uploadingAvatar.value = false
	} catch (err) {
		avatarError.value = err instanceof Error ? err.message : 'Erreur upload'
		previewUrl.value = null
		uploadingAvatar.value = false
	}
}
</script>
