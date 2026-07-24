<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useAuthFormStore } from '../../stores/authForm'
import PasswordInput from './PasswordInput.vue'

const authFormStore = useAuthFormStore()
const authStore = useAuthStore()
const identifier = ref('')
const email = ref('')
const username = ref('')
const password = ref('')
const passwordConfirm = ref('')
const localError = ref<string | null>(null)

watch(
  () => authFormStore.mode,
  () => {
    localError.value = null
    passwordConfirm.value = ''
  },
)

async function onSubmit(): Promise<void> {
  localError.value = null

  if (authFormStore.mode === 'signup' && password.value !== passwordConfirm.value) {
    localError.value = 'Les mots de passe ne correspondent pas.'
    return
  }

  try {
    if (authFormStore.mode === 'login') {
      await authStore.signIn(identifier.value, password.value)
    } else {
      await authStore.signUp(username.value, email.value, password.value)
    }
    identifier.value = ''
    email.value = ''
    username.value = ''
    password.value = ''
    passwordConfirm.value = ''
  } catch {
    localError.value = authStore.authError ?? 'Action impossible.'
  }
}
</script>

<template>
  <div class="w-full" aria-labelledby="auth-form-title">
    <h2 id="auth-form-title" class="grim-modal-title mb-5 text-center text-3xl">
      {{ authFormStore.mode === 'login' ? 'Connexion' : 'Inscription' }}
    </h2>

    <form class="space-y-3 sm:space-y-4" @submit.prevent="onSubmit">
      <div v-if="authFormStore.mode === 'signup'" class="form-control">
        <label class="label"><span class="label-text">Nom d'utilisateur</span></label>
        <input v-model="username" type="text" class="input w-full" required autocomplete="username" />
      </div>

      <div v-if="authFormStore.mode === 'login'" class="form-control">
        <label class="label"><span class="label-text">Email ou nom d'utilisateur</span></label>
        <input v-model="identifier" type="text" class="input w-full" required autocomplete="username" />
      </div>

      <div v-if="authFormStore.mode === 'signup'" class="form-control">
        <label class="label"><span class="label-text">Email</span></label>
        <input v-model="email" type="email" class="input w-full" required autocomplete="email" />
      </div>

      <PasswordInput
        v-model="password"
        label="Mot de passe"
        required
        :minlength="6"
        :autocomplete="authFormStore.mode === 'login' ? 'current-password' : 'new-password'"
        :show-strength="authFormStore.mode === 'signup'"
      />

      <PasswordInput
        v-if="authFormStore.mode === 'signup'"
        v-model="passwordConfirm"
        label="Confirmer le mot de passe"
        required
        :minlength="6"
        autocomplete="new-password"
      />

      <div v-if="localError" role="alert" class="alert alert-error alert-soft text-sm">
        <span>{{ localError }}</span>
      </div>

      <button type="submit" class="btn mt-1 min-h-11 w-full sm:mt-2" :disabled="authStore.loading">
        <span v-if="authStore.loading" class="loading loading-spinner loading-sm" aria-hidden="true" />
        <span>{{ authFormStore.mode === 'login' ? 'Se connecter' : 'Créer le compte' }}</span>
      </button>
    </form>

    <div class="mt-4 text-center text-sm leading-relaxed opacity-80 sm:mt-5">
      <p v-if="authFormStore.mode === 'login'">
        Nouveau dans l'Empire ?
        <button
          type="button"
          class="link link-primary font-semibold sm:ml-1"
          @click="authFormStore.setMode('signup')"
        >
          Créer un compte
        </button>
      </p>
      <p v-else>
        Déja inscrit ?
        <button
          type="button"
          class="link link-primary font-semibold sm:ml-1"
          @click="authFormStore.setMode('login')"
        >
          Se connecter
        </button>
      </p>
    </div>
  </div>
</template>
