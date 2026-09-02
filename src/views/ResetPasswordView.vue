<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PasswordInput from '../components/ui/PasswordInput.vue'
import AppCard from '../components/ui/AppCard.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const password = ref('')
const confirmation = ref('')
const submitted = ref(false)
const localError = ref<string | null>(null)
const success = ref(false)
const sessionReady = ref(false)

const validationError = computed(() => {
  if (!submitted.value) {
    return null
  }
  if (password.value.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caracteres.'
  }
  if (password.value !== confirmation.value) {
    return 'Les mots de passe ne correspondent pas.'
  }
  return null
})

async function submit(): Promise<void> {
  submitted.value = true
  localError.value = null
  if (validationError.value) {
    return
  }
  if (!sessionReady.value) {
    localError.value = 'Le lien de recuperation est invalide ou a expire.'
    return
  }

  try {
    await authStore.updatePassword(password.value)
    success.value = true
    password.value = ''
    confirmation.value = ''
  } catch {
    localError.value = authStore.authError ?? 'Mise a jour impossible.'
  }
}

function returnHome(): void {
  void router.replace('/')
}

onMounted(async () => {
  try {
    await authStore.initAuth()
    sessionReady.value = Boolean(authStore.session)
  } catch {
    localError.value = 'Impossible de verifier le lien de recuperation.'
  }
})
</script>

<template>
  <main class="flex min-h-[70vh] items-center justify-center p-4 sm:p-6">
    <AppCard title="Nouveau mot de passe" class="w-full max-w-md">
      <form v-if="!success" class="space-y-4" @submit.prevent="submit">
        <p class="text-sm text-base-content/70">Choisis un nouveau mot de passe pour ton compte.</p>
        <div v-if="authStore.initialized && !sessionReady" role="alert" class="alert alert-error alert-soft text-sm"><span>Le lien de recuperation est invalide ou a expire.</span></div>
        <PasswordInput v-model="password" label="Nouveau mot de passe" required minlength="8" autocomplete="new-password" show-strength :invalid="Boolean(validationError)" />
        <PasswordInput v-model="confirmation" label="Confirmer le mot de passe" required minlength="8" autocomplete="new-password" :invalid="Boolean(validationError)" />
        <div v-if="validationError" role="alert" class="alert alert-error alert-soft text-sm"><span>{{ validationError }}</span></div>
        <div v-if="localError" role="alert" class="alert alert-error alert-soft text-sm"><span>{{ localError }}</span></div>
        <button type="submit" class="btn btn-primary min-h-11 w-full" :disabled="authStore.loading" :aria-busy="authStore.loading ? 'true' : 'false'">
          <span v-if="authStore.loading" class="loading loading-spinner loading-sm" aria-hidden="true" />
          Enregistrer le nouveau mot de passe
        </button>
      </form>
      <div v-else class="space-y-4">
        <div role="status" class="alert alert-success alert-soft"><span>Ton mot de passe a ete mis a jour.</span></div>
        <button type="button" class="btn btn-primary min-h-11 w-full" @click="returnHome">Retour a l accueil</button>
      </div>
    </AppCard>
  </main>
</template>