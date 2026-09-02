<script setup lang="ts">
import { ArrowLeft, Compass } from '@lucide/vue'
</script>

<template>
	<main class="min-h-[calc(100dvh-4rem)] bg-base-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
		<div class="mx-auto max-w-6xl">
			<header class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">Atlas de campagne</p>
					<h1 class="grim-modal-title mt-2 text-4xl sm:text-5xl">Le Vieux Monde</h1>
					<p class="max-w-2xl text-base leading-relaxed text-base-content/80">
						Une vue de référence pour situer les voyages, les royaumes et les terres sauvages de vos aventures.
					</p>
				</div>
				<router-link to="/" class="btn btn-outline btn-sm min-h-11 shrink-0 self-start">
					<ArrowLeft class="size-4" aria-hidden="true" />
					<span>Retour à l'accueil</span>
				</router-link>
			</header>

			<figure class="overflow-hidden rounded-box border border-base-300 bg-base-200 p-2 shadow-sm sm:p-3">
				<div class="overflow-auto rounded-field bg-base-100">
					<img
						src="/old-world-map.svg"
						alt="Carte stylisée et originale du Vieux Monde, montrant des régions, des mers et une rose des vents."
						class="block h-auto w-full object-contain"
					/>
				</div>
				<figcaption class="flex items-start gap-2 px-2 pb-1 pt-3 text-sm leading-relaxed text-base-content/70 sm:px-3 sm:pt-4">
					<Compass class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
					<span>Carte statique de référence. Les marqueurs et annotations de campagne ne sont pas encore disponibles.</span>
				</figcaption>
			</figure>
		</div>
	</main>
</template>