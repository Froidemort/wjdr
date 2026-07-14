<template>
	<main class="mx-auto max-w-5xl p-4 sm:p-6">
		<section class="hero rounded-box border border-base-300 bg-base-100">
			<div class="hero-content text-center py-12">
				<div class="max-w-2xl space-y-4">
					<h1 class="text-4xl font-bold sm:text-5xl">Warhammer JDR V2</h1>
					<p v-if="authStore.isAuthenticated && authStore.displayName" class="text-lg font-medium">
						Bienvenue <span class="badge badge-ghost">{{ authStore.displayName }}</span> !
					</p>
					<p class="text-base-content/80">
						GRIMORIUM est un outil de gestion de parties pour le jeu de rôle Warhammer JDR V2. Il permet aux joueurs et maîtres de jeu de créer et gérer des sessions, des personnages et des campagnes.
					</p>
					<div v-if="!authStore.isAuthenticated" class="flex flex-wrap justify-center gap-3 pt-2">
						<button class="btn w-full sm:w-auto" @click="openSignup">Inscription</button>
						<button class="btn w-full sm:w-auto" @click="openLogin">Connexion</button>
					</div>
					
					<div v-else class="flex flex-wrap justify-center gap-3 pt-2">
						<button class="btn btn-accent w-full sm:w-auto" @click="openSessionCreate">
							<Plus class="h-5 w-5" />
							Créer une session
						</button>
						<router-link class="btn btn-accent w-full sm:w-auto" to="/sessions">
							<Scroll class="h-5 w-5" />
							Mes sessions
						</router-link>
						<router-link class="btn btn-accent w-full sm:w-auto" to="/characters">
							<Users class="h-5 w-5" />
							Mes personnages
						</router-link>
					</div>
					<p class="text-base-content/80">
						Une section de ressources sera bientôt disponible pour vous aider à créer vos parties et personnages.
					</p>
				</div>
			</div>
		</section>
	</main>
</template>

<script setup lang="ts">
import { Plus, Scroll, Users } from '@lucide/vue'
import { useAuthStore } from '../../stores/auth'
import { useAuthModalStore } from '../../stores/authModal'
import { useSessionCreateModalStore } from '../../stores/sessionCreateModal'

const authStore = useAuthStore()
const authModalStore = useAuthModalStore()
const sessionCreateModalStore = useSessionCreateModalStore()

function openLogin(): void {
	authModalStore.openModal('login')
}

function openSignup(): void {
	authModalStore.openModal('signup')
}

function openSessionCreate(): void {
	sessionCreateModalStore.openModal()
}

</script>