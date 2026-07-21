<script setup lang="ts">
import { customAlphabet } from 'nanoid'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createSession } from '../../repositories/sessionsRepository'
import { useAuthStore } from '../../stores/auth'
import { useSessionCreateModalStore } from '../../stores/sessionCreateModal'

const modalStore = useSessionCreateModalStore()
const authStore = useAuthStore()
const router = useRouter()
const dialogRef = ref<HTMLDialogElement | null>(null)
const lastFocusedElement = ref<HTMLElement | null>(null)
const name = ref('')
const description = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const generateAlphaNumeric = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

function generateSessionCode(): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateAlphaNumeric()
    const letterCount = (candidate.match(/[A-Z]/g) ?? []).length
    if (letterCount >= 2) {
      return candidate
    }
  }

  // Fallback deterministic mix to guarantee at least two letters.
  const fallback = generateAlphaNumeric().split('')
  fallback[0] = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 1)()
  fallback[1] = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 1)()
  return fallback.join('')
}

function mapCreateSessionError(error: unknown): string {
  if (error instanceof Error) {
    const maybeStatus = (error as { status?: number }).status
    const message = error.message.toLowerCase()

    if (
      maybeStatus === 403 ||
      message.includes('row-level security') ||
      message.includes('permission denied')
    ) {
      return 'Le grimoire reste scelle pour l instant. Verifiez vos droits puis reessayez.'
    }

    if (
      message.includes('networkerror') ||
      message.includes('failed to fetch') ||
      message.includes('timeout') ||
      message.includes('net_timeout')
    ) {
      return 'Les vents d Azyr brouillent le reseau. Reessayez dans un instant.'
    }

    return error.message
  }

  return 'La creation de la table a echoue.'
}

watch(
  () => modalStore.isOpen,
  (shouldOpen) => {
    if (!dialogRef.value) {
      return
    }

    if (shouldOpen) {
      lastFocusedElement.value = document.activeElement as HTMLElement | null
      dialogRef.value.showModal()
    } else {
      dialogRef.value.close()
      lastFocusedElement.value?.focus()
    }
  }
)

async function onSubmit(): Promise<void> {
  if (!authStore.user?.id || loading.value) {
    return
  }

  loading.value = true
  errorMessage.value = null
  try {
    let sessionId: string | null = null
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        sessionId = await createSession({
          mjId: authStore.user.id,
          name: name.value.trim(),
          description: description.value.trim(),
          code: generateSessionCode(),
        })
        break
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : ''
        if (!message.includes('duplicate') && !message.includes('unique')) {
          throw error
        }
      }
    }

    if (!sessionId) {
      throw new Error('Impossible de forger un sceau de session valide.')
    }

    modalStore.closeModal()
    name.value = ''
    description.value = ''
    await router.push(`/sessions/${sessionId}`)
  } catch (error) {
    errorMessage.value = mapCreateSessionError(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <dialog ref="dialogRef" class="modal modal-middle" aria-labelledby="session-create-title" @close="modalStore.closeModal()">
    <div class="modal-box w-11/12 max-w-xl border border-base-300 p-4 sm:p-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <button class="btn btn-sm btn-circle btn-outline absolute right-2 top-2" @click="modalStore.closeModal()" aria-label="Fermer la modale">✕</button>
      <h3 id="session-create-title" class="mb-1 pr-8 text-center text-2xl font-semibold">Créer une session</h3>
      <p class="mb-5 text-center text-sm opacity-70">Renseignez les informations de votre table avant de lancer l'aventure.</p>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="form-control">
          <label class="label" for="session-name">
            <span class="label-text">Nom de la session</span>
          </label>
          <input id="session-name" v-model="name" type="text" class="input w-full" required maxlength="100" />
        </div>

        <div class="form-control">
          <label class="label" for="session-description">
            <span class="label-text">Description</span>
          </label>
          <textarea id="session-description" v-model="description" class="textarea w-full min-h-28" rows="4" maxlength="500" />
          <label class="label">
            <span class="label-text-alt opacity-70">500 caractères maximum</span>
          </label>
        </div>

        <div v-if="errorMessage" role="alert" class="alert alert-error alert-soft text-sm">
          <span>{{ errorMessage }}</span>
        </div>

        <button type="submit" class="btn btn-accent w-full mt-1" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm" aria-hidden="true" />
          <span>Valider</span>
        </button>
      </form>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>Fermer</button>
    </form>
  </dialog>
</template>
