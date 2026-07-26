<template>
	<main class="w-full">
		<section
			v-if="!authStore.isAuthenticated"
			class="grid lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-2"
			aria-label="Accueil et authentification"
		>
			<div
				class="order-2 bg-gradient-to-b from-base-100 to-base-200/30 px-6 py-10 sm:px-10 lg:order-1 lg:px-12 lg:py-14 xl:px-16"
			>
				<div class="mx-auto max-w-md lg:mx-0 lg:max-w-lg">
					<header class="space-y-3">
						<p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">Warhammer JDR V2</p>
						<h1 id="home-brand" class="grim-modal-title text-4xl sm:text-5xl">Grimorium</h1>
						<div class="h-px w-16 bg-primary/40" aria-hidden="true" />
						<p class="text-sm leading-relaxed text-base-content/80 sm:text-base">
							GRIMORIUM est un outil de gestion de parties pour le jeu de rôle Warhammer JDR V2. Il
							permet aux joueurs et maîtres de jeu de créer et gérer des campagnes, des sessions
							(datées), des personnages et des notes.
						</p>
						<p class="flex gap-2 text-sm text-base-content/60">
							<Scroll class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
							<span>Ressources à venir pour préparer vos parties et personnages.</span>
						</p>
					</header>

					<ul
						class="mt-8 divide-y divide-base-300/60 border-y border-base-300/60"
						aria-label="Ce que propose Grimorium"
					>
						<HomePillarCard
							v-for="pillar in pillars"
							:key="pillar.title"
							:numeral="pillar.numeral"
							:title="pillar.title"
							:description="pillar.description"
							:icon="pillar.icon"
						/>
					</ul>
				</div>
			</div>

			<div
				class="order-1 flex flex-col justify-center border-b border-base-300/50 bg-base-200/40 px-6 py-10 sm:px-10 lg:order-2 lg:min-h-[calc(100dvh-8rem)] lg:border-b-0 lg:border-l lg:px-12 lg:py-14 xl:px-16"
			>
				<AuthForm class="mx-auto w-full max-w-md" />
			</div>
		</section>

		<template v-else>
			<div class="min-h-[calc(100dvh-8rem)] p-4 sm:p-6 lg:px-8">
				<section
					class="mb-8 flex flex-col justify-center px-2 py-8 text-center sm:py-10"
					aria-labelledby="home-brand"
				>
					<p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">Warhammer JDR V2</p>
					<h1 id="home-brand" class="grim-modal-title mt-3 text-5xl sm:text-6xl">Grimorium</h1>
					<p v-if="authStore.displayName" class="mt-4 text-base font-medium sm:text-lg">
						Bienvenue,
						<span class="badge badge-ghost badge-lg align-middle">{{ authStore.displayName }}</span>
					</p>
				</section>

				<section class="grid gap-3 sm:grid-cols-3 sm:gap-4" aria-label="Actions rapides">
					<button
						type="button"
						class="rounded-box border border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-primary/40 hover:bg-base-200 sm:p-5"
						@click="openCampaignCreate"
					>
						<div class="mb-2 flex items-center gap-2.5">
							<Plus class="size-5 shrink-0 text-primary" aria-hidden="true" />
							<span class="font-semibold">Créer une campagne</span>
						</div>
						<p class="text-sm text-base-content/75">Lancez une nouvelle table pour votre campagne.</p>
					</button>

					<router-link
						to="/campaigns"
						class="rounded-box border border-base-300 bg-base-100 p-4 transition-colors hover:border-primary/40 hover:bg-base-200 sm:p-5"
					>
						<div class="mb-2 flex items-center gap-2.5">
							<Scroll class="size-5 shrink-0 text-primary" aria-hidden="true" />
							<span class="font-semibold">Mes campagnes</span>
						</div>
						<p class="text-sm text-base-content/75">Retrouvez vos tables en cours et archivées.</p>
					</router-link>

					<router-link
						to="/characters"
						class="rounded-box border border-base-300 bg-base-100 p-4 transition-colors hover:border-primary/40 hover:bg-base-200 sm:p-5"
					>
						<div class="mb-2 flex items-center gap-2.5">
							<Users class="size-5 shrink-0 text-primary" aria-hidden="true" />
							<span class="font-semibold">Mes personnages</span>
						</div>
						<p class="text-sm text-base-content/75">Consultez et mettez à jour vos feuilles.</p>
					</router-link>
				</section>
			</div>
		</template>
	</main>
</template>

<script setup lang="ts">
import { NotebookPen, Plus, Scroll, Users } from '@lucide/vue'
import { useAuthStore } from '../../stores/auth'
import { useCampaignCreateModalStore } from '../../stores/campaignCreateModal'
import AuthForm from '../components/AuthForm.vue'
import HomePillarCard from '../components/HomePillarCard.vue'

const authStore = useAuthStore()
const campaignCreateModalStore = useCampaignCreateModalStore()

const pillars = [
  {
    numeral: 'I',
    title: 'Campagnes',
		description: 'Créez une table, invitez vos joueurs et suivez la campagne au travers de sessions datées.',
    icon: Scroll,
  },
  {
    numeral: 'II',
    title: 'Personnages',
    description: 'Feuilles V2 : caractéristiques, carrières et équipement.',
    icon: Users,
  },
  {
    numeral: 'III',
    title: 'Notes',
		description: 'Notes de campagne, accès et progression pour le MJ et les joueurs.',
    icon: NotebookPen,
  },
] as const

function openCampaignCreate(): void {
	campaignCreateModalStore.openModal()
}
</script>
