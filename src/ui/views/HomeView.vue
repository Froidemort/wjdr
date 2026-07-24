<template>
	<main class="flex min-h-[calc(100dvh-8rem)] w-full flex-col p-4 sm:p-6 lg:px-8">
		<!-- Invité : présentation + catégories à gauche, auth à droite -->
		<section
			v-if="!authStore.isAuthenticated"
			class="grid flex-1 items-stretch gap-4 lg:grid-cols-2 lg:gap-6"
			aria-label="Accueil et authentification"
		>
			<div
				class="grim-hero-panel order-2 flex flex-col justify-center rounded-box px-5 py-8 sm:px-8 sm:py-10 lg:order-1 lg:px-10 lg:py-12"
			>
				<div class="mx-auto flex w-full max-w-xl flex-col gap-6 lg:mx-0 lg:max-w-none">
					<div class="space-y-4">
						<h1 id="home-brand" class="grim-modal-title text-4xl sm:text-5xl lg:text-6xl">Grimorium</h1>
						<p class="text-base leading-relaxed text-base-content/80 sm:text-lg">
							GRIMORIUM est un outil de gestion de parties pour le jeu de rôle Warhammer JDR V2. Il
							permet aux joueurs et maîtres de jeu de créer et gérer des sessions, des personnages et
							des campagnes.
						</p>
						<p class="text-sm leading-relaxed text-base-content/70 sm:text-base">
							Une section de ressources sera bientôt disponible pour vous aider à créer vos parties et
							personnages.
						</p>
					</div>

					<ul class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1" aria-label="Ce que propose Grimorium">
						<li
							v-for="pillar in pillars"
							:key="pillar.title"
							class="rounded-box border border-base-300/80 bg-base-100/60 p-3.5 sm:p-4"
						>
							<div class="mb-1.5 flex items-center gap-2.5">
								<component :is="pillar.icon" class="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
								<span class="font-semibold leading-tight">{{ pillar.title }}</span>
							</div>
							<p class="text-sm leading-relaxed text-base-content/75">{{ pillar.description }}</p>
						</li>
					</ul>
				</div>
			</div>

			<div
				class="order-1 flex items-center rounded-box border border-base-300 bg-base-100 p-5 sm:p-7 lg:order-2 lg:p-8"
			>
				<div class="mx-auto w-full max-w-md">
					<AuthForm />
				</div>
			</div>
		</section>

		<!-- Connecté -->
		<template v-else>
			<section
				class="grim-hero-panel mb-6 flex flex-col justify-center rounded-box px-5 py-10 sm:px-10 sm:py-12"
				aria-labelledby="home-brand"
			>
				<div class="mx-auto w-full max-w-3xl space-y-4 text-center">
					<h1 id="home-brand" class="grim-modal-title text-5xl sm:text-6xl">Grimorium</h1>
					<p v-if="authStore.displayName" class="text-base font-medium sm:text-lg">
						Bienvenue,
						<span class="badge badge-ghost badge-lg align-middle">{{ authStore.displayName }}</span>
					</p>
				</div>
			</section>

			<section class="grid gap-3 sm:grid-cols-3 sm:gap-4" aria-label="Actions rapides">
				<button
					type="button"
					class="rounded-box border border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-primary/40 hover:bg-base-200 sm:p-5"
					@click="openSessionCreate"
				>
					<div class="mb-2 flex items-center gap-2.5">
						<Plus class="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
						<span class="font-semibold">Créer une session</span>
					</div>
					<p class="text-sm text-base-content/75">Lancez une nouvelle table pour votre campagne.</p>
				</button>

				<router-link
					to="/sessions"
					class="rounded-box border border-base-300 bg-base-100 p-4 transition-colors hover:border-primary/40 hover:bg-base-200 sm:p-5"
				>
					<div class="mb-2 flex items-center gap-2.5">
						<Scroll class="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
						<span class="font-semibold">Mes sessions</span>
					</div>
					<p class="text-sm text-base-content/75">Retrouvez vos parties en cours et archives.</p>
				</router-link>

				<router-link
					to="/characters"
					class="rounded-box border border-base-300 bg-base-100 p-4 transition-colors hover:border-primary/40 hover:bg-base-200 sm:p-5"
				>
					<div class="mb-2 flex items-center gap-2.5">
						<Users class="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
						<span class="font-semibold">Mes personnages</span>
					</div>
					<p class="text-sm text-base-content/75">Consultez et mettez à jour vos feuilles.</p>
				</router-link>
			</section>
		</template>
	</main>
</template>

<script setup lang="ts">
import { Map, Plus, Scroll, Users } from '@lucide/vue'
import type { Component } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSessionCreateModalStore } from '../../stores/sessionCreateModal'
import AuthForm from '../components/AuthForm.vue'

const authStore = useAuthStore()
const sessionCreateModalStore = useSessionCreateModalStore()

const pillars: ReadonlyArray<{ title: string; description: string; icon: Component }> = [
  {
    title: 'Sessions',
    description: 'Créez une table, invitez vos joueurs et suivez la campagne au même endroit.',
    icon: Scroll,
  },
  {
    title: 'Personnages',
    description: 'Gérez vos feuilles Warhammer JDR V2 : caractéristiques, carrières et équipement.',
    icon: Users,
  },
  {
    title: 'Tables',
    description: 'Centralisez notes, accès et progression pour le maître de jeu comme pour les joueurs.',
    icon: Map,
  },
]

function openSessionCreate(): void {
  sessionCreateModalStore.openModal()
}
</script>
