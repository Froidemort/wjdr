<template>
  <main class="flex min-h-[60vh] items-center justify-center p-6">
    <section class="card card-border w-full max-w-lg bg-base-100 shadow-sm">
      <div class="card-body items-center text-center">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Erreur 404</p>
        <h1 class="card-title mt-2 text-3xl">Page introuvable</h1>
        <p class="text-base-content/70">Cette page n existe pas ou n est plus disponible.</p>
        <div class="card-actions mt-4">
          <router-link to="/" class="btn btn-primary min-h-11">Retour a l accueil</router-link>
          <button type="button" class="btn btn-ghost min-h-11" @click="$router.back()">Page precedente</button>
        </div>
      </div>
    </section>
  </main>
</template>