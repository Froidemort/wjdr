<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAuthFormStore } from '../../stores/authForm'
import PasswordInput from './PasswordInput.vue'

const authFormStore = useAuthFormStore()
const authStore = useAuthStore()
const router = useRouter()
const identifier = ref('')
const email = ref('')
const username = ref('')
const password = ref('')
const passwordConfirm = ref('')
const localError = ref<string | null>(null)
const formSubmitted = ref(false)
const isResetRequested = ref(false)
const isResetFormOpen = ref(false)
const resetEmail = ref('')
const resetError = ref<string | null>(null)
const resetEmailInput = ref<HTMLInputElement | null>(null)

const isLogin = computed(() => authFormStore.mode === 'login')

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const identifierError = computed(() => {
  if (!isLogin.value || !formSubmitted.value) {
    return null
  }

  return identifier.value.trim() ? null : "Renseigne ton email ou nom d'utilisateur."
})

const usernameError = computed(() => {
  if (isLogin.value || !formSubmitted.value) {
    return null
  }

  return username.value.trim() ? null : "Renseigne ton nom d'utilisateur."
})

const emailError = computed(() => {
  if (isLogin.value || !formSubmitted.value) {
    return null
  }

  const value = email.value.trim()
  if (!value) {
    return 'Renseigne un email.'
  }

  return isValidEmail(value) ? null : 'Format email invalide.'
})

const passwordError = computed(() => {
  if (!formSubmitted.value) {
    return null
  }

  if (!password.value.trim()) {
    return 'Renseigne un mot de passe.'
  }

  return password.value.length >= 6 ? null : 'Le mot de passe doit contenir au moins 6 caracteres.'
})

const passwordConfirmError = computed(() => {
  if (isLogin.value || !formSubmitted.value) {
    return null
  }

  if (!passwordConfirm.value.trim()) {
    return 'Confirme ton mot de passe.'
  }

  return password.value === passwordConfirm.value ? null : 'Les mots de passe ne correspondent pas.'
})

const tabClass = (active: boolean) =>
  [
    'cursor-pointer border-b-2 pb-3 font-[family-name:var(--font-grim-title)] text-sm uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100',
    active
      ? 'border-primary text-base-content'
      : 'border-transparent text-base-content/45 hover:text-base-content/70',
  ].join(' ')

watch(
  () => authFormStore.mode,
  () => {
    localError.value = null
    formSubmitted.value = false
    passwordConfirm.value = ''
    isResetFormOpen.value = false
    isResetRequested.value = false
    resetError.value = null
  },
)

async function toggleResetForm(): Promise<void> {
  isResetFormOpen.value = !isResetFormOpen.value
  resetError.value = null
  isResetRequested.value = false

  if (isResetFormOpen.value) {
    await nextTick()
    resetEmailInput.value?.focus()
  }
}

function closeResetForm(): void {
  isResetFormOpen.value = false
  resetError.value = null
  isResetRequested.value = false
}

async function onSubmit(): Promise<void> {
  formSubmitted.value = true
  localError.value = null

  if (
    identifierError.value ||
    usernameError.value ||
    emailError.value ||
    passwordError.value ||
    passwordConfirmError.value
  ) {
    return
  }

  try {
    if (isLogin.value) {
      await authStore.signIn(identifier.value, password.value)
      await router.replace('/')
    } else {
      await authStore.signUp(username.value, email.value, password.value)
    }
    identifier.value = ''
    email.value = ''
    username.value = ''
    password.value = ''
    passwordConfirm.value = ''
    formSubmitted.value = false
  } catch {
    localError.value = authStore.authError ?? 'Action impossible.'
  }
}

async function requestPasswordReset(): Promise<void> {
  resetError.value = null
  isResetRequested.value = false

  const normalizedEmail = resetEmail.value.trim()
  if (!isValidEmail(normalizedEmail)) {
    resetError.value = 'Renseigne une adresse email valide.'
    return
  }

  try {
    await authStore.requestPasswordReset(normalizedEmail)
    isResetRequested.value = true
  } catch {
    resetError.value = authStore.authError ?? 'Demande impossible.'
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
        <input v-model="username" type="text" class="input w-full ui-critical-control" :aria-invalid="usernameError ? 'true' : 'false'" :aria-errormessage="usernameError ? 'auth-username-error' : undefined" :aria-describedby="usernameError ? 'auth-username-error' : undefined" required autocomplete="username" />
        <p v-if="usernameError" id="auth-username-error" class="label text-error text-xs">{{ usernameError }}</p>
      </div>

      <div v-if="isLogin" class="form-control">
        <label class="label py-1">
          <span class="label-text">Email ou nom d'utilisateur</span>
        </label>
        <input v-model="identifier" type="text" class="input w-full ui-critical-control" :aria-invalid="identifierError ? 'true' : 'false'" :aria-errormessage="identifierError ? 'auth-identifier-error' : undefined" :aria-describedby="identifierError ? 'auth-identifier-error' : undefined" required autocomplete="username" />
        <p v-if="identifierError" id="auth-identifier-error" class="label text-error text-xs">{{ identifierError }}</p>
      </div>

      <div v-if="!isLogin" class="form-control">
        <label class="label py-1">
          <span class="label-text">Email</span>
        </label>
        <input v-model="email" type="email" class="input w-full ui-critical-control" :aria-invalid="emailError ? 'true' : 'false'" :aria-errormessage="emailError ? 'auth-email-error' : undefined" :aria-describedby="emailError ? 'auth-email-error' : undefined" required autocomplete="email" />
        <p v-if="emailError" id="auth-email-error" class="label text-error text-xs">{{ emailError }}</p>
      </div>

      <PasswordInput
        v-model="password"
        label="Mot de passe"
        required
        :minlength="6"
        :autocomplete="isLogin ? 'current-password' : 'new-password'"
        :show-strength="!isLogin"
        :invalid="Boolean(passwordError)"
        :error-message-id="passwordError ? 'auth-password-error' : null"
      />
      <p v-if="passwordError" id="auth-password-error" class="label text-error text-xs">{{ passwordError }}</p>

      <PasswordInput
        v-if="!isLogin"
        v-model="passwordConfirm"
        label="Confirmer le mot de passe"
        required
        :minlength="6"
        autocomplete="new-password"
        :invalid="Boolean(passwordConfirmError)"
        :error-message-id="passwordConfirmError ? 'auth-password-confirm-error' : null"
      />
      <p v-if="passwordConfirmError" id="auth-password-confirm-error" class="label text-error text-xs">{{ passwordConfirmError }}</p>

      <div v-if="localError" role="alert" class="alert alert-error alert-soft text-sm">
        <span>{{ localError }}</span>
      </div>

      <button type="submit" class="btn btn-primary ui-critical-action mt-2 min-h-11 w-full" :disabled="authStore.loading" :aria-busy="authStore.loading ? 'true' : 'false'">
        <span v-if="authStore.loading" class="loading loading-spinner loading-sm" aria-hidden="true" />
        <span>{{ isLogin ? 'Se connecter' : 'Créer le compte' }}</span>
      </button>
    </form>

    <div v-if="isLogin" class="mt-4 border-t border-base-300/50 pt-4">
      <button
        type="button"
        class="link link-primary block mx-auto text-sm font-semibold"
        aria-controls="password-reset-panel"
        :aria-expanded="isResetFormOpen ? 'true' : 'false'"
        @click="toggleResetForm"
      >
        Mot de passe oublié ?
      </button>
      <div v-if="isResetFormOpen" id="password-reset-panel" class="mt-3">
        <form class="space-y-3" @submit.prevent="requestPasswordReset">
          <label class="form-control">
            <span class="label py-1"><span class="label-text">Email de récupération</span></span>
            <input ref="resetEmailInput" v-model="resetEmail" type="email" class="input w-full" required autocomplete="email" aria-describedby="password-reset-help" />
          </label>
          <p id="password-reset-help" class="text-xs text-base-content/60">Un lien sera envoyé si cette adresse est associée à un compte.</p>
          <div v-if="resetError" role="alert" aria-live="assertive" class="alert alert-error alert-soft text-sm"><span>{{ resetError }}</span></div>
          <div v-if="isResetRequested" role="status" aria-live="polite" class="alert alert-success alert-soft text-sm">
            <span>Si cette adresse est associée à un compte, un email de récupération vient d'être envoyé.</span>
          </div>
          <button type="submit" class="btn btn-ghost min-h-11 w-full" :disabled="authStore.loading" :aria-busy="authStore.loading ? 'true' : 'false'">
            <span v-if="authStore.loading" class="loading loading-spinner loading-sm" aria-hidden="true" />
            Envoyer le lien de récupération
          </button>
          <button type="button" class="link link-primary block mx-auto text-sm" @click="closeResetForm">Annuler</button>
        </form>
      </div>
    </div>

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
