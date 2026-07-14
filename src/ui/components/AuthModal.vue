<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthModalStore } from '../../stores/authModal'
import { useAuthStore } from '../../stores/auth'

const authModalStore = useAuthModalStore()
const authStore = useAuthStore()
const dialogRef = ref<HTMLDialogElement | null>(null)
const identifier = ref('')
const email = ref('')
const username = ref('')
const password = ref('')
const localError = ref<string | null>(null)

watch(() => authModalStore.isOpen, (shouldOpen) => {
  if (dialogRef.value) {
    if (shouldOpen) {
      dialogRef.value.showModal()
    } else {
      dialogRef.value.close()
    }
  }
})

watch(() => authModalStore.mode, () => {
  localError.value = null
})

async function onSubmit(): Promise<void> {
  localError.value = null
  try {
    if (authModalStore.mode === 'login') {
      await authStore.signIn(identifier.value, password.value)
    } else {
      await authStore.signUp(username.value, email.value, password.value)
    }
    authModalStore.closeModal()
    identifier.value = ''
    email.value = ''
    username.value = ''
    password.value = ''
  } catch {
    localError.value = authStore.authError ?? 'Action impossible.'
  }
}
</script>

<template>
  <dialog 
    ref="dialogRef" 
    class="modal modal-middle"
    @close="authModalStore.closeModal()"
  >
    <div class="modal-box border border-base-300 p-6">
      
      <button 
        @click="authModalStore.closeModal()" 
        class="btn btn-sm btn-circle btn-outline absolute right-2 top-2"
      >✕</button>

      <h3 class="mb-4 text-center text-2xl font-semibold">
        {{ authModalStore.mode === 'login' ? 'Connexion' : 'Inscription' }}
      </h3>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div v-if="authModalStore.mode === 'signup'" class="form-control">
          <label class="label"><span class="label-text">Nom d'utilisateur</span></label>
          <input v-model="username" type="text" class="input w-full" required />
        </div>

        <div v-if="authModalStore.mode === 'login'" class="form-control">
          <label class="label"><span class="label-text">Email ou username</span></label>
          <input v-model="identifier" type="text" class="input w-full" required />
        </div>

        <div v-if="authModalStore.mode === 'signup'" class="form-control">
          <label class="label"><span class="label-text">Email</span></label>
          <input v-model="email" type="email" class="input w-full" required />
        </div>
        
        <div class="form-control">
          <label class="label"><span class="label-text">Mot de passe</span></label>
          <input v-model="password" type="password" class="input w-full" required minlength="6" />
        </div>

        <div v-if="localError" role="alert" class="alert alert-error alert-soft text-sm">
          <span>{{ localError }}</span>
        </div>

        <button type="submit" class="btn w-full mt-2" :class="authStore.loading ? 'btn-disabled' : ''">
          <span v-if="authStore.loading" class="loading loading-spinner loading-sm" aria-hidden="true" />
          <span>{{ authModalStore.mode === 'login' ? 'Se connecter' : 'Créer le compte' }}</span>
        </button>
      </form>

      <div class="text-xs text-center mt-4 opacity-70">
        <span v-if="authModalStore.mode === 'login'">
          Nouveau dans l'Empire ?
          <button @click="authModalStore.mode = 'signup'" class="link ml-1">Créer un compte</button>
        </span>
        <span v-else>
          Déja inscrit ?
          <button @click="authModalStore.mode = 'login'" class="link ml-1">Se connecter</button>
        </span>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>Fermer</button>
    </form>
  </dialog>
</template>