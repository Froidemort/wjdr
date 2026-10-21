<template>
  <main class="mx-auto max-w-6xl space-y-4 p-4 pb-40 sm:p-6 sm:pb-6">
    <div v-if="loading && !character" class="skeleton h-56 w-full" />

    <div v-else-if="errorMessage && !character" role="alert" class="alert alert-error alert-soft">
      <span>{{ errorMessage }}</span>
    </div>

    <template v-else-if="character">
      <div v-if="errorMessage" role="alert" class="alert alert-error alert-soft">
        <span class="min-w-0 flex-1">{{ errorMessage }}</span>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11"
          aria-label="Fermer le message d'erreur"
          @click="errorMessage = null"
        >
          ✕
        </button>
      </div>

      <CharacterSummaryHeader
        :name="character.name"
        :race="character.race"
        :gender="character.gender"
        :career-name="character.careerName"
        :editable="canEditQuickSection"
        @edit-career="openCareerModal"
      />

      <CharacterSyncStatus
        :state="globalState"
        :queued-count="queuedCount"
        :online="isOnline"
        @retry="retrySave"
      />

      <div v-if="actionSuccessMessage" class="toast toast-bottom toast-end z-50 p-2 sm:p-4">
        <div class="alert bg-success text-success-content py-3 px-4 min-h-0 shadow-lg gap-2 border-0" role="status" aria-live="polite">
          <span class="text-sm sm:text-base font-medium">{{ actionSuccessMessage }}</span>
        </div>
      </div>

      <CharacterOverview
        :race="character.race"
        :stats="character.stats"
        :armors="characterArmors"
        :weapons="characterWeapons"
        :items="characterItems"
        :values="editable"
        :editable="canEditQuickSection"
        :busy="Boolean(actionBusyKey)"
        @quick-change="onQuickValueChange"
        @equip-armor="onEquipArmorFromDoll"
        @unequip-armor="onUnequipArmorFromDoll"
        @unequip-armors="onUnequipArmorsFromDoll"
        @equip-weapon="onEquipWeaponFromDoll"
        @unequip-weapon="onUnequipWeaponFromDoll"
      />

      <CharacterTabs v-model="activeCharacterTab" />

      <CharacterProfilePanel
        v-show="activeCharacterTab === 'stats'"
        :stats="character.stats"
        :editable="canEditQuickSection"
        @stat-tick="onStatTick"
        @stat-base-change="onStatBaseChange"
        @stat-total-advanced-change="onStatTotalAdvancedChange"
      />

      <CharacterSkillsTalentsPanel
        v-show="activeCharacterTab === 'skills'"
        :skills="sortedCharacterSkills"
        :talents="sortedCharacterTalents"
        :editable="canEditQuickSection"
        :busy-key="actionBusyKey"
        :skills-message="getSectionSuccessMessage('skills')"
        :talents-message="getSectionSuccessMessage('talents')"
        @add-skills="openCatalogModal('skills')"
        @add-talents="openCatalogModal('talents')"
        @delete-skill="onDeleteSkill"
        @delete-talent="onDeleteTalent"
        @change-mastery="onChangeSkillMastery"
        @show-description="openDescriptionModal"
      />

      <CharacterInventoryPanel
        v-show="activeCharacterTab === 'inventory'"
        :weapons="sortedCharacterWeapons"
        :armors="sortedCharacterArmors"
        :items="sortedCharacterItems"
        :values="editable"
        :editable="canEditQuickSection"
        :busy-key="actionBusyKey"
        :weapons-message="getSectionSuccessMessage('weapons')"
        :armors-message="getSectionSuccessMessage('armors')"
        :items-message="getSectionSuccessMessage('items') || getSectionSuccessMessage('catalog')"
        @add="openCatalogModal"
        @quick-change="onQuickValueChange"
        @money-commit="onMoneyCommit"
        @money-subtract="onMoneySubtract"
        @delete-weapon="onDeleteWeapon"
        @delete-armor="onDeleteArmor"
        @delete-item="onDeleteItem"
        @weapon-quality-change="onWeaponQualityChange"
        @armor-quality-change="onArmorQualityChange"
        @item-quality-change="onItemQualityChange"
        @item-quantity-change="onChangeItemQuantity"
        @show-description="openDescriptionModal"
      />

      <DescriptionModal
        ref="descriptionModal"
        :title="descriptionTitle"
        :content="descriptionContent"
        @close="closeDescriptionModal"
        @closed="onDescriptionDialogClosed"
      />
    </template>

    <CareerChangeModal
      ref="careerModal"
      v-model:filter-mode="careerFilterMode"
      v-model:query="careerQuery"
      :options="careerOptions"
      :path-options-count="careerPathOptions.length"
      :path-loading="careerPathLoading"
      :search-loading="careerSearchLoading"
      :selected-id="selectedCareerId"
      :selected-name="selectedCareerName"
      :error="careerError"
      :success-message="getSectionSuccessMessage('career')"
      :busy="changingCareer || careerCharacteristicsLoading"
      @select="selectCareer"
      @confirm="confirmCareerChange"
      @close="closeCareerModal"
      @closed="onCareerDialogClosed"
    />

    <CareerConfirmModal
      ref="careerConfirmModal"
      :career-name="pendingCareerName"
      :rows="pendingCareerCharacteristicRows"
      :error="careerConfirmError"
      :busy="changingCareer"
      @apply="applyCareerChange"
      @close="closeCareerConfirmModal"
      @closed="onCareerConfirmDialogClosed"
    />

    <CatalogAddModal
      ref="catalogModal"
      v-model:query="catalogQuery"
      v-model:mode="itemCatalogMode"
      v-model:items-quality="selectedItemsQuality"
      v-model:items-quantity="selectedItemsQuantity"
      v-model:form="newItemForm"
      :section="catalogSection"
      :section-label="modalSectionLabel"
      :options="displayedCatalogOptions"
      :hidden-options-count="catalogOptions.length - displayedCatalogOptions.length"
      :selected-ids="selectedCatalogIds"
      :selected-labels="selectedCatalogLabels"
      :search-loading="catalogSearchLoading"
      :search-failed="catalogSearchFailed"
      :error="catalogError"
      :adding="addingCatalog"
      :creating="creatingItem"
      :format-label="formatCatalogOptionLabel"
      @toggle="toggleCatalogSelection"
      @remove="removeCatalogSelection"
      @confirm-add="confirmCatalogAdd"
      @confirm-create="confirmItemCreate"
      @close="closeCatalogModal"
      @closed="onCatalogDialogClosed"
    />

    <footer class="flex flex-wrap gap-2">
      <router-link v-if="character" class="btn btn-sm min-h-11 flex-1" :to="`/campaigns/${character.campaignId}`">
        <ChevronLeft class="h-4 w-4" />
        Retour à la campagne
      </router-link>
      <router-link class="btn btn-sm min-h-11 flex-1" to="/characters?all=1">
        <Users class="h-4 w-4" />
        Tous les personnages
      </router-link>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { ChevronLeft, Users } from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'
import type { CharacterTabId } from '../types/characterSheet'
import CareerChangeModal from '../components/character/CareerChangeModal.vue'
import CareerConfirmModal from '../components/character/CareerConfirmModal.vue'
import CatalogAddModal from '../components/character/CatalogAddModal.vue'
import CharacterOverview from '../components/character/CharacterOverview.vue'
import CharacterInventoryPanel from '../components/character/CharacterInventoryPanel.vue'
import CharacterProfilePanel from '../components/character/CharacterProfilePanel.vue'
import CharacterSkillsTalentsPanel from '../components/character/CharacterSkillsTalentsPanel.vue'
import CharacterSyncStatus from '../components/character/CharacterSyncStatus.vue'
import CharacterSummaryHeader from '../components/character/CharacterSummaryHeader.vue'
import CharacterTabs from '../components/character/CharacterTabs.vue'
import DescriptionModal from '../components/character/DescriptionModal.vue'
import { useCharacterCareer } from '../composables/useCharacterCareer'
import { useCharacterCatalogActions } from '../composables/useCharacterCatalogActions'
import { useCharacterDescriptionModal } from '../composables/useCharacterDescriptionModal'
import { useCharacterSheet } from '../composables/useCharacterSheet'
import { useIsOnline } from '../composables/useIsOnline'
import { useQueuedUpdatesCount } from '../composables/useQueuedUpdatesCount'

const activeCharacterTab = ref<CharacterTabId>('stats')

watch(activeCharacterTab, async (tab) => {
  await nextTick()
  const panel = document.getElementById(`character-panel-${tab}`)
  if (!panel) return
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  panel.scrollIntoView({ behavior, block: 'start' })
})
const {
  character,
  loading,
  errorMessage,
  editable,
  canEditQuickSection,
  actionBusyKey,
  actionSuccessMessage,
  globalState,
  retrySave,
  characterWeapons,
  characterArmors,
  characterItems,
  sortedCharacterSkills,
  sortedCharacterTalents,
  sortedCharacterWeapons,
  sortedCharacterArmors,
  sortedCharacterItems,
  loadCharacter,
  loadCharacterLinks,
  invalidateCurrentLinksCache,
  onQuickValueChange,
  onMoneyCommit,
  onMoneySubtract,
  onStatTick,
  onStatBaseChange,
  onStatTotalAdvancedChange,
  onChangeSkillMastery,
  onDeleteSkill,
  onDeleteTalent,
  onDeleteWeapon,
  onDeleteArmor,
  onDeleteItem,
  onWeaponQualityChange,
  onArmorQualityChange,
  onItemQualityChange,
  onChangeItemQuantity,
  onEquipArmorFromDoll,
  onUnequipArmorFromDoll,
  onUnequipArmorsFromDoll,
  onEquipWeaponFromDoll,
  onUnequipWeaponFromDoll,
  setSectionSuccess,
  getSectionSuccessMessage,
  confirmDestructiveAction,
} = useCharacterSheet()
const isOnline = useIsOnline()
const { queuedCount } = useQueuedUpdatesCount()

const careerModal = ref<InstanceType<typeof CareerChangeModal> | null>(null)
const careerConfirmModal = ref<InstanceType<typeof CareerConfirmModal> | null>(null)
const catalogModal = ref<InstanceType<typeof CatalogAddModal> | null>(null)
const descriptionModal = ref<InstanceType<typeof DescriptionModal> | null>(null)

const careerDialogRef = computed(() => careerModal.value?.dialog ?? null)
const careerConfirmDialogRef = computed(() => careerConfirmModal.value?.dialog ?? null)
const catalogDialogRef = computed(() => catalogModal.value?.dialog ?? null)
const descriptionDialogRef = computed(() => descriptionModal.value?.dialog ?? null)

const {
  careerQuery,
  careerOptions,
  careerPathOptions,
  careerFilterMode,
  selectedCareerId,
  selectedCareerName,
  pendingCareerName,
  pendingCareerCharacteristicRows,
  careerError,
  careerConfirmError,
  changingCareer,
  careerSearchLoading,
  careerPathLoading,
  careerCharacteristicsLoading,
  openCareerModal,
  closeCareerModal,
  onCareerDialogClosed,
  selectCareer,
  closeCareerConfirmModal,
  onCareerConfirmDialogClosed,
  confirmCareerChange,
  applyCareerChange,
} = useCharacterCareer({
  character,
  canEditQuickSection,
  loadCharacter,
  setSectionSuccess,
  careerDialogRef,
  careerConfirmDialogRef,
})

const {
  catalogSection,
  catalogQuery,
  catalogOptions,
  displayedCatalogOptions,
  selectedCatalogIds,
  selectedCatalogLabels,
  catalogError,
  addingCatalog,
  itemCatalogMode,
  creatingItem,
  catalogSearchLoading,
  catalogSearchFailed,
  selectedItemsQuality,
  selectedItemsQuantity,
  newItemForm,
  modalSectionLabel,
  formatCatalogOptionLabel,
  openCatalogModal,
  closeCatalogModal,
  onCatalogDialogClosed,
  toggleCatalogSelection,
  removeCatalogSelection,
  confirmCatalogAdd,
  confirmItemCreate,
} = useCharacterCatalogActions({
  character,
  canEditQuickSection,
  invalidateCurrentLinksCache,
  loadCharacterLinks,
  setSectionSuccess,
  confirmDestructiveAction,
  catalogDialogRef,
})

const {
  descriptionTitle,
  descriptionContent,
  openDescriptionModal,
  closeDescriptionModal,
  onDescriptionDialogClosed,
} = useCharacterDescriptionModal(descriptionDialogRef)
</script>
