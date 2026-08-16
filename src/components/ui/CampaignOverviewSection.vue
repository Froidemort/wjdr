<script setup lang="ts">
import { Copy } from '@lucide/vue'
import { computed } from 'vue'
import type { CampaignSummary, CharacterSummary } from '../../types/domain'
import AppCard from './AppCard.vue'
import CharacterSummaryCard from './CharacterSummaryCard.vue'

type CharacterListFilter = 'all' | 'mine' | 'others'

const props = defineProps<{
  session: CampaignSummary
  isMj: boolean
  feedbackMap: Record<string, string>
  archiveBusy: boolean
  sessionInfoOpen: boolean
  canCreateOwnCharacter: boolean
  characterStats: {
    total: number
    mine: number
    others: number
  }
  characterListFilter: CharacterListFilter
  characters: CharacterSummary[]
  filteredCharacters: CharacterSummary[]
  highlightedCharacterId: string | null
  characterCreateSuccess: string | null
}>()

const emit = defineEmits<{
  'update:sessionInfoOpen': [value: boolean]
  'update:characterListFilter': [value: CharacterListFilter]
  'open-character-create': []
  'toggle-archive': []
  'copy-code': []
  'copy-link': []
}>()

const sessionInfoOpenModel = computed({
  get: () => props.sessionInfoOpen,
  set: (value: boolean) => emit('update:sessionInfoOpen', value),
})
</script>

<template>
  <section id="campaign-panel-overview" role="tabpanel" aria-labelledby="campaign-tab-overview">
    <AppCard :title="session.name">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="badge" :class="isMj ? 'badge-secondary' : 'badge-neutral'">
            {{ isMj ? 'MJ' : 'Joueur' }}
          </span>
          <span v-if="session.isArchived" class="badge badge-warning">Archivée</span>
          <span class="badge badge-outline font-mono">Code: {{ session.code }}</span>
          <div class="join join-vertical sm:join-horizontal">
            <div class="tooltip" :data-tip="feedbackMap['campaign-code'] || 'Copier le code de campagne'">
              <button class="btn btn-xs ui-critical-action join-item" @click="emit('copy-code')">
                <Copy class="h-3 w-3" />
                Code
              </button>
            </div>
            <div class="tooltip" :data-tip="feedbackMap['campaign-link'] || 'Copier le lien de partage'">
              <button class="btn btn-xs ui-critical-action join-item" @click="emit('copy-link')">
                <Copy class="h-3 w-3" />
                Lien
              </button>
            </div>
          </div>
        </div>
        <button
          v-if="isMj"
          class="btn btn-sm ui-critical-action"
          :class="session.isArchived ? 'btn-success' : 'btn-warning'"
          :disabled="archiveBusy"
          :aria-busy="archiveBusy ? 'true' : 'false'"
          @click="emit('toggle-archive')"
        >
          <span v-if="archiveBusy" class="loading loading-spinner loading-xs" aria-hidden="true" />
          {{ session.isArchived ? 'Restaurer la campagne' : 'Archiver la campagne' }}
        </button>
      </div>

      <div class="collapse collapse-arrow border border-base-300 bg-base-200">
        <input v-model="sessionInfoOpenModel" type="checkbox" />
        <div class="collapse-title font-semibold">Description</div>
        <div class="collapse-content">
          <p class="text-sm opacity-80">{{ session.description || 'Aucune description.' }}</p>
        </div>
      </div>

      <div id="campaign-characters-section" class="mt-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-semibold">Personnages</h2>
          <button
            v-if="canCreateOwnCharacter"
            class="btn btn-sm ui-critical-action"
            @click="emit('open-character-create')"
          >
            Créer mon personnage
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="badge badge-outline">Total: {{ characterStats.total }}</span>
          <span class="badge badge-outline">Moi: {{ characterStats.mine }}</span>
          <span class="badge badge-outline">Autres: {{ characterStats.others }}</span>
        </div>

        <div class="join join-vertical sm:join-horizontal">
          <button
            class="btn btn-xs ui-critical-action join-item"
            :class="characterListFilter === 'all' ? 'btn-active' : ''"
            @click="emit('update:characterListFilter', 'all')"
          >
            Tous
          </button>
          <button
            class="btn btn-xs ui-critical-action join-item"
            :class="characterListFilter === 'mine' ? 'btn-active' : ''"
            @click="emit('update:characterListFilter', 'mine')"
          >
            Mes persos
          </button>
          <button
            class="btn btn-xs ui-critical-action join-item"
            :class="characterListFilter === 'others' ? 'btn-active' : ''"
            @click="emit('update:characterListFilter', 'others')"
          >
            Autres
          </button>
        </div>

        <div
          v-if="characterCreateSuccess"
          role="status"
          aria-live="polite"
          class="alert alert-success alert-soft text-sm"
        >
          <span>{{ characterCreateSuccess }}</span>
        </div>

        <div v-if="characters.length === 0" class="alert alert-warning alert-soft">
          <span>Aucun personnage dans cette campagne.</span>
        </div>

        <div v-else-if="filteredCharacters.length === 0" class="alert alert-info alert-soft text-sm">
          <span>Aucun personnage pour ce filtre.</span>
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CharacterSummaryCard
            v-for="character in filteredCharacters"
            :key="character.id"
            :character="character"
            action-label="Voir la fiche"
            :class="
              character.id === highlightedCharacterId
                ? 'ring-2 ring-success ring-offset-2 ring-offset-base-100'
                : ''
            "
            compact
          />
        </div>
      </div>
    </AppCard>
  </section>
</template>
