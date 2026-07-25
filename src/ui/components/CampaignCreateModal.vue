<script setup lang="ts">
import { customAlphabet } from 'nanoid'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createCampaign } from '../../repositories/campaignsRepository'
import { useAuthStore } from '../../stores/auth'
import { useCampaignCreateModalStore } from '../../stores/campaignCreateModal'

const modalStore = useCampaignCreateModalStore()
const authStore = useAuthStore()
const router = useRouter()
const dialogRef = ref<HTMLDialogElement | null>(null)
const lastFocusedElement = ref<HTMLElement | null>(null)
const name = ref('')
const description = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const submitAttempted = ref(false)

const generateAlphaNumeric = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

function generateCampaignCode(): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateAlphaNumeric()
    const letterCount = (candidate.match(/[A-Z]/g) ?? []).length
    if (letterCount >= 2) {
      return candidate
    }
  }

  const fallback = generateAlphaNumeric().split('')
  fallback[0] = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 1)()
  fallback[1] = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 1)()
  return fallback.join('')
}

function mapCreateCampaignError(error: unknown): string {
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

  return 'La creation de la campagne a echoue.'
}

const nameError = computed(() => {
  if (!submitAttempted.value) {
    return null
  }

  return name.value.trim() ? null : 'Le nom de la campagne est requis.'
})

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

  submitAttempted.value = true
  if (nameError.value) {
    return
  }

  loading.value = true
  errorMessage.value = null
  try {
    let campaignId: string | null = null
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        campaignId = await createCampaign({
          mjId: authStore.user.id,
          name: name.value.trim(),
          description: description.value.trim(),
          code: generateCampaignCode(),
        })
        break
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : ''
        if (!message.includes('duplicate') && !message.includes('unique')) {
          throw error
        }
      }
    }

    if (!campaignId) {
      throw new Error('Impossible de forger un sceau de campagne valide.')
    }

    modalStore.closeModal()
    name.value = ''
    description.value = ''
    submitAttempted.value = false
    await router.push(`/campaigns/${campaignId}`)
  } catch (error) {
    errorMessage.value = mapCreateCampaignError(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <dialog ref="dialogRef" class="modal modal-middle" aria-labelledby="campaign-create-title" @close="modalStore.closeModal()">
    <div class="modal-box grim-modal-box w-11/12 max-w-xl p-4 sm:p-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <button class="btn btn-circle min-h-11 min-w-11 grim-modal-close absolute right-3 top-3" @click="modalStore.closeModal()" aria-label="Fermer la modale">✕</button>
      <h3 id="campaign-create-title" class="grim-modal-title mb-1 pr-8 text-center text-3xl">Créer une campagne</h3>
      <p class="mb-5 text-center text-sm opacity-70">Renseignez les informations de votre table avant de lancer l'aventure.</p>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="form-control">
          <label class="label" for="campaign-name">
            <span class="label-text">Nom de la campagne</span>
          </label>
          <input id="campaign-name" v-model="name" type="text" class="input w-full ui-critical-control" :aria-invalid="nameError ? 'true' : 'false'" :aria-errormessage="nameError ? 'campaign-name-error' : undefined" :aria-describedby="nameError ? 'campaign-name-error' : undefined" required maxlength="100" />
          <p v-if="nameError" id="campaign-name-error" class="label text-error text-xs">{{ nameError }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="campaign-description">
            <span class="label-text">Description</span>
          </label>
          <textarea id="campaign-description" v-model="description" class="textarea w-full min-h-28 ui-critical-control" :aria-invalid="errorMessage ? 'true' : 'false'" rows="4" maxlength="500" />
          <label class="label">
            <span class="label-text-alt opacity-70">500 caractères maximum</span>
          </label>
        </div>

        <div v-if="errorMessage" role="alert" class="alert alert-error alert-soft text-sm">
          <span>{{ errorMessage }}</span>
        </div>

        <button type="submit" class="btn ui-critical-action w-full mt-1" :disabled="loading" :aria-busy="loading ? 'true' : 'false'">
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
