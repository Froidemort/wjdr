<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export interface CompendiumDialogLink {
  id: string
  label: string
  to: RouteLocationRaw
}

const props = defineProps<{
  open: boolean
  title: string
  badges?: string[]
  description: string | null
  relatedLabel: string
  related: CompendiumDialogLink[]
}>()

const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLDialogElement | null>(null)

function syncDialog(): void {
  const dialog = dialogRef.value
  if (!dialog) return
  if (props.open && !dialog.open) dialog.showModal()
  else if (!props.open && dialog.open) dialog.close()
}

onMounted(syncDialog)
watch(() => props.open, syncDialog, { flush: 'post' })
</script>

<template>
  <dialog ref="dialogRef" class="modal" :aria-label="title" @close="emit('close')">
    <div class="modal-box flex flex-col gap-4">
      <header class="flex flex-col gap-2">
        <h2 class="text-xl font-bold">{{ title }}</h2>
        <ul v-if="badges?.length" class="flex flex-wrap gap-1" aria-label="Propriétés">
          <li v-for="badge in badges" :key="badge" class="badge badge-sm badge-outline">{{ badge }}</li>
        </ul>
      </header>

      <p v-if="description" class="text-sm whitespace-pre-line opacity-90">{{ description }}</p>
      <p v-else class="text-sm opacity-60">Aucune description disponible.</p>

      <section v-if="related.length" class="flex flex-col gap-2">
        <h3 class="text-xs font-semibold uppercase tracking-wide opacity-70">{{ relatedLabel }}</h3>
        <ul class="flex flex-wrap gap-2">
          <li v-for="link in related" :key="link.id">
            <router-link :to="link.to" class="badge badge-primary badge-outline min-h-8 h-auto py-1">
              {{ link.label }}
            </router-link>
          </li>
        </ul>
      </section>

      <div class="modal-action mt-0">
        <form method="dialog">
          <button class="btn btn-sm">Fermer</button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button aria-label="Fermer">Fermer</button>
    </form>
  </dialog>
</template>
