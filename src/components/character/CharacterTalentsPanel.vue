<script setup lang="ts">
import { Info, Plus, Trash2 } from '@lucide/vue'
import type { CharacterTalent } from '../../types/domain'
import { formatNamedWithSpecialization } from '../../utils/characterSheet'

defineProps<{
  talents: CharacterTalent[]
  editable: boolean
  busyKey: string | null
  successMessage: string | null
}>()

const emit = defineEmits<{
  add: []
  delete: [talentId: string]
  'show-description': [title: string, description: string | null]
}>()
</script>

<template>
  <section aria-labelledby="character-talents-title">
    <h3 id="character-talents-title" class="mb-3 text-base font-semibold">Talents</h3>
    <div v-if="successMessage" role="status" class="alert alert-success alert-soft mb-3 text-sm">
      <span>{{ successMessage }}</span>
    </div>
    <div v-if="editable" class="mb-3 flex justify-start">
      <button
        class="btn btn-sm btn-square min-h-11 min-w-11"
        aria-label="Ajouter des talents"
        @click.stop.prevent="emit('add')"
      >
        <Plus class="h-4 w-4" />
      </button>
    </div>
    <p v-if="talents.length === 0" class="text-sm opacity-70">Aucun talent.</p>
    <div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <article
        v-for="talent in talents"
        :key="talent.talentId"
        v-memo="[talent.talentId, editable]"
        class="group card border border-base-300 bg-base-100"
      >
        <div class="card-body min-w-0 gap-2 p-3">
          <div class="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h4 class="min-w-0 max-w-full flex-1 break-words text-left font-semibold leading-snug [overflow-wrap:anywhere]">
              {{ formatNamedWithSpecialization(talent.name, talent.specialization) }}
            </h4>
            <div class="hover-actions ml-auto flex shrink-0 items-center gap-1 self-end sm:self-start">
              <button
                v-if="talent.description"
                class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11"
                aria-label="Afficher la description du talent"
                @click="emit('show-description', formatNamedWithSpecialization(talent.name, talent.specialization), talent.description)"
              >
                <Info class="h-4 w-4" />
              </button>
              <button
                v-if="editable"
                class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11"
                :disabled="Boolean(busyKey)"
                :aria-busy="busyKey === `talent-${talent.talentId}` ? 'true' : 'false'"
                :aria-label="`Supprimer ${talent.name}`"
                @click="emit('delete', talent.talentId)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
