<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const isLogin = computed(() => authFormStore.mode === 'login')

const tabClass = (active: boolean) =>
  [
    'cursor-pointer border-b-2 pb-3 font-[family-name:var(--font-grim-title)] text-sm uppercase tracking-wide transition-colors',
    active
      ? 'border-primary text-base-content'
      : 'border-transparent text-base-content/45 hover:text-base-content/70',
  ].join(' ')

watch(
  () => authFormStore.mode,
  () => {
    localError.value = null
    passwordConfirm.value = ''
  },
)

async function onSubmit(): Promise<void> {
  localError.value = null

  if (!isLogin.value && password.value !== passwordConfirm.value) {
    localError.value = 'Les mots de passe ne correspondent pas.'
    return
  }

  try {
    if (isLogin.value) {
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
    <div
      role="tablist"
      aria-label="Mode d'authentification"
      class="mb-6 flex justify-center gap-8 border-b border-base-300/70 sm:gap-12"
    >
      <button
        id="auth-tab-login"
        type="button"
        role="tab"
        :class="tabClass(isLogin)"
        :aria-selected="isLogin ? 'true' : 'false'"
        aria-controls="auth-form-panel"
        @click="authFormStore.setMode('login')"
      >
        Connexion
      </button>
      <button
        id="auth-tab-signup"
        type="button"
        role="tab"
        :class="tabClass(!isLogin)"
        :aria-selected="!isLogin ? 'true' : 'false'"
        aria-controls="auth-form-panel"
        @click="authFormStore.setMode('signup')"
      >
        Inscription
      </button>
    </div>

    <h2 id="auth-form-title" class="sr-only">
      {{ isLogin ? 'Connexion' : 'Inscription' }}
    </h2>

    <form
      id="auth-form-panel"
      role="tabpanel"
      :aria-labelledby="isLogin ? 'auth-tab-login' : 'auth-tab-signup'"
      class="space-y-4"
      @submit.prevent="onSubmit"
    >
      <div v-if="!isLogin" class="form-control">
        <label class="label py-1">
          <span class="label-text">Nom d'utilisateur</span>
        </label>
        <input v-model="username" type="text" class="input w-full" required autocomplete="username" />
      </div>

      <div v-if="isLogin" class="form-control">
        <label class="label py-1">
          <span class="label-text">Email ou nom d'utilisateur</span>
        </label>
        <input v-model="identifier" type="text" class="input w-full" required autocomplete="username" />
      </div>

      <div v-if="!isLogin" class="form-control">
        <label class="label py-1">
          <span class="label-text">Email</span>
        </label>
        <input v-model="email" type="email" class="input w-full" required autocomplete="email" />
      </div>

      <PasswordInput
        v-model="password"
        label="Mot de passe"
        required
        :minlength="6"
        :autocomplete="isLogin ? 'current-password' : 'new-password'"
        :show-strength="!isLogin"
      />

      <PasswordInput
        v-if="!isLogin"
        v-model="passwordConfirm"
        label="Confirmer le mot de passe"
        required
        :minlength="6"
        autocomplete="new-password"
      />

      <div v-if="localError" role="alert" class="alert alert-error alert-soft text-sm">
        <span>{{ localError }}</span>
      </div>

      <button type="submit" class="btn btn-primary mt-2 min-h-11 w-full" :disabled="authStore.loading">
        <span v-if="authStore.loading" class="loading loading-spinner loading-sm" aria-hidden="true" />
        <span>{{ isLogin ? 'Se connecter' : 'Créer le compte' }}</span>
      </button>
    </form>

    <div class="mt-5 border-t border-base-300/50 pt-4 text-center text-sm leading-relaxed text-base-content/70">
      <p v-if="isLogin">
        Nouveau dans l'Empire ?
        <button
          type="button"
          class="link link-primary cursor-pointer font-semibold"
          @click="authFormStore.setMode('signup')"
        >
          Créer un compte
        </button>
      </p>
      <p v-else>
        Déjà inscrit ?
        <button
          type="button"
          class="link link-primary cursor-pointer font-semibold"
          @click="authFormStore.setMode('login')"
        >
          Se connecter
        </button>
      </p>
    </div>
  </div>
</template>
