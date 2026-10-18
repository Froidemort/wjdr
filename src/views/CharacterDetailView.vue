<template>
  <main class="mx-auto max-w-6xl space-y-4 p-4 pb-40 sm:p-6 sm:pb-6">
    <div v-if="loading && !character" class="skeleton h-56 w-full" />

    <div v-else-if="errorMessage && !character" role="alert" class="alert alert-error alert-soft">
      <span>{{ errorMessage }}</span>
    </div>

    <template v-else-if="character">
      <CharacterSummaryHeader
        :name="character.name"
        :race="character.race"
        :gender="character.gender"
        :career-name="character.careerName"
        :values="editable"
        :editable="canEditQuickSection"
        @edit-career="openCareerModal"
        @quick-change="onQuickValueChange"
      />

      <div v-if="globalState !== 'ok'" class="toast toast-bottom toast-end z-50 p-2 sm:p-4">
        <div :class="['alert py-3 px-4 min-h-0 shadow-lg gap-2 border-0', globalState === 'error' ? 'bg-error text-error-content' : 'bg-warning text-warning-content']" role="status" aria-live="polite">
          <LoaderCircle v-if="globalState === 'loading'" class="h-5 w-5 flex-shrink-0 animate-spin" />
          <CircleX v-else class="h-5 w-5 flex-shrink-0" />
          <span class="text-sm sm:text-base font-medium">{{ globalStateLabel }}</span>
        </div>
      </div>

      <div v-if="actionSuccessMessage" class="toast toast-bottom toast-end z-50 p-2 sm:p-4">
        <div class="alert bg-success text-success-content py-3 px-4 min-h-0 shadow-lg gap-2 border-0" role="status" aria-live="polite">
          <span class="text-sm sm:text-base font-medium">{{ actionSuccessMessage }}</span>
        </div>
      </div>

      <CharacterTabs v-model="activeCharacterTab" />

      <!-- From lg, Profil and Inventaire share the screen side by side. -->
      <div
        v-show="activeCharacterTab === 'profile' || activeCharacterTab === 'inventory'"
        class="grid gap-4 lg:grid-cols-2 lg:items-start"
      >
        <CharacterProfilePanel
          :class="{ 'max-lg:hidden': activeCharacterTab !== 'profile' }"
          :race="character.race"
          :stats="character.stats"
          :armors="characterArmors"
          :weapons="characterWeapons"
          :items="characterItems"
          :editable="canEditQuickSection"
          :busy="Boolean(actionBusyKey)"
          @stat-tick="onStatTick"
          @stat-base-change="onStatBaseChange"
          @stat-total-advanced-change="onStatTotalAdvancedChange"
          @equip-armor="onEquipArmorFromDoll"
          @unequip-armor="onUnequipArmorFromDoll"
          @unequip-armors="onUnequipArmorsFromDoll"
          @equip-weapon="onEquipWeaponFromDoll"
          @unequip-weapon="onUnequipWeaponFromDoll"
        />

        <CharacterInventoryPanel
          :class="{ 'max-lg:hidden': activeCharacterTab !== 'inventory' }"
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
          @weapon-state-change="onWeaponStateChange"
          @weapon-quality-change="onWeaponQualityChange"
          @armor-state-change="onArmorStateChange"
          @armor-quality-change="onArmorQualityChange"
          @item-quality-change="onItemQualityChange"
          @item-quantity-change="onChangeItemQuantity"
          @show-description="openDescriptionModal"
        />
      </div>

      <CharacterSkillsPanel
        v-show="activeCharacterTab === 'skills'"
        :skills="sortedCharacterSkills"
        :editable="canEditQuickSection"
        :busy-key="actionBusyKey"
        :success-message="getSectionSuccessMessage('skills')"
        @add="openCatalogModal('skills')"
        @delete="onDeleteSkill"
        @change-mastery="onChangeSkillMastery"
        @show-description="openDescriptionModal"
      />

      <CharacterTalentsPanel
        v-show="activeCharacterTab === 'talents'"
        :talents="sortedCharacterTalents"
        :editable="canEditQuickSection"
        :busy-key="actionBusyKey"
        :success-message="getSectionSuccessMessage('talents')"
        @add="openCatalogModal('talents')"
        @delete="onDeleteTalent"
        @show-description="openDescriptionModal"
      />

      <dialog ref="descriptionDialogRef" class="modal modal-top sm:modal-middle" @close="onDescriptionDialogClosed">
        <div class="modal-box grim-modal-box p-6 max-w-lg">
          <button class="btn btn-sm btn-circle grim-modal-close absolute right-3 top-3" @click="closeDescriptionModal" aria-label="Fermer">✕</button>
          <h3 class="grim-modal-title text-2xl pr-8">{{ descriptionTitle || 'Description' }}</h3>
          <p class="mt-3 whitespace-pre-line text-sm opacity-90">{{ descriptionContent || 'Aucune description.' }}</p>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>Fermer</button>
        </form>
      </dialog>
    </template>

		<dialog ref="careerDialogRef" class="modal modal-top sm:modal-middle" @close="onCareerDialogClosed">
      <div class="modal-box grim-modal-box p-6">
        <button class="btn btn-sm btn-circle grim-modal-close absolute right-3 top-3" @click="closeCareerModal" aria-label="Fermer">✕</button>
        <h3 class="grim-modal-title mb-4 text-center text-3xl">Changer de carrière</h3>

				<div class="space-y-3">
          <div class="join" role="group" aria-label="Filtre des carrieres">
            <button
              type="button"
              class="btn btn-sm join-item ui-critical-action"
              :class="careerFilterMode === 'paths' ? 'btn-active' : ''"
              :aria-pressed="careerFilterMode === 'paths'"
              @click="careerFilterMode = 'paths'"
            >
              Débouchés
            </button>
            <button
              type="button"
              class="btn btn-sm join-item ui-critical-action"
              :class="careerFilterMode === 'all' ? 'btn-active' : ''"
              :aria-pressed="careerFilterMode === 'all'"
              @click="careerFilterMode = 'all'"
            >
              Toutes
            </button>
          </div>
					<SearchInput v-model="careerQuery" placeholder="Chercher une carrière" />
          <p class="text-xs opacity-70">
            {{ careerFilterMode === 'all' ? 'Saisissez au moins 2 caractères.' : 'Filtre actif: débouchés de la carrière actuelle.' }}
          </p>
          <div v-if="careerPathLoading" class="flex items-center gap-2 text-sm opacity-70">
            <span class="loading loading-spinner loading-xs" aria-hidden="true" />
            Chargement des débouchés...
          </div>
          <div v-if="careerSearchLoading" class="flex items-center gap-2 text-sm opacity-70">
            <span class="loading loading-spinner loading-xs" aria-hidden="true" />
            Recherche des carrières...
          </div>

					<div class="max-h-64 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2">
						<ul v-if="careerOptions.length > 0" class="menu menu-sm">
							<li v-for="option in careerOptions" :key="option.id">
								<button
									class="justify-start"
									:class="selectedCareerId === option.id ? 'menu-active' : ''"
									@click="selectCareer(option.id, option.name)"
								>
									{{ option.name }}
								</button>
							</li>
						</ul>
            <p v-else class="text-sm opacity-70 px-2 py-1">
              {{
                careerFilterMode === 'all'
                  ? careerQuery.trim().length < 2
                    ? 'Commencez a taper pour rechercher une carriere.'
                    : 'Aucune carriere trouvee.'
                  : careerPathOptions.length === 0
                    ? 'Aucun debouche disponible pour la carriere actuelle.'
                    : 'Aucune carriere ne correspond a votre recherche.'
              }}
            </p>
					</div>

					<p v-if="selectedCareerName" class="text-sm opacity-80">Sélection: {{ selectedCareerName }}</p>
          <div v-if="getSectionSuccessMessage('career')" role="status" class="alert alert-success alert-soft text-sm">
            <span>{{ getSectionSuccessMessage('career') }}</span>
          </div>
					<div v-if="careerError" role="alert" class="alert alert-error alert-soft text-sm">
						<span>{{ careerError }}</span>
					</div>

          <div class="grim-modal-actions flex items-center justify-end gap-2">
						<button class="btn btn-sm ui-critical-action" @click="closeCareerModal">Annuler</button>
            <button class="btn btn-sm ui-critical-action" :disabled="changingCareer || careerCharacteristicsLoading" @click="confirmCareerChange">
              <span v-if="changingCareer || careerCharacteristicsLoading" class="loading loading-spinner loading-xs" aria-hidden="true" />
							Valider
						</button>
					</div>
				</div>
			</div>

			<form method="dialog" class="modal-backdrop">
				<button>Fermer</button>
			</form>
		</dialog>

		<dialog ref="careerConfirmDialogRef" class="modal modal-top sm:modal-middle" @close="onCareerConfirmDialogClosed">
      <div class="modal-box grim-modal-box p-6">
        <button class="btn btn-sm btn-circle grim-modal-close absolute right-3 top-3" @click="closeCareerConfirmModal()" aria-label="Fermer">✕</button>
        <h3 class="grim-modal-title mb-2 text-center text-3xl">Appliquer le profil de carrière</h3>

        <p class="text-sm opacity-80">
          Nouvelle carrière: <span class="font-semibold">{{ pendingCareerName }}</span>
        </p>
        <p class="mt-1 text-sm opacity-80">
          Choisissez si vous souhaitez remplacer les avancées totales du personnage avec le profil de cette carrière.
        </p>

        <div class="mt-4 rounded-box border border-base-300 bg-base-100 p-3">
          <p class="mb-2 text-xs opacity-70">Profil de carrière proposé (avancées totales)</p>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            <div v-for="entry in pendingCareerCharacteristicRows" :key="`career-profile-${entry.statCode}`" class="rounded-lg border border-base-300 bg-base-200 px-2 py-1 text-center">
              <p class="text-xs font-semibold">{{ entry.statCode }}</p>
              <p class="text-sm tabular-nums">{{ entry.value }}</p>
            </div>
          </div>
        </div>

        <div v-if="careerConfirmError" role="alert" class="alert alert-error alert-soft mt-4 text-sm">
          <span>{{ careerConfirmError }}</span>
        </div>

        <div class="grim-modal-actions mt-4 flex flex-wrap items-center justify-end gap-2">
          <button class="btn btn-sm ui-critical-action" :disabled="changingCareer" @click="closeCareerConfirmModal()">Annuler</button>
          <button class="btn btn-sm ui-critical-action" :disabled="changingCareer" @click="applyCareerChange(false)">
            <span v-if="changingCareer" class="loading loading-spinner loading-xs" aria-hidden="true" />
            Ne pas appliquer
          </button>
          <button class="btn btn-sm ui-critical-action" :disabled="changingCareer" @click="applyCareerChange(true)">
            <span v-if="changingCareer" class="loading loading-spinner loading-xs" aria-hidden="true" />
            Appliquer
          </button>
        </div>
      </div>

			<form method="dialog" class="modal-backdrop">
				<button>Fermer</button>
			</form>
		</dialog>

		<dialog ref="catalogDialogRef" class="modal modal-top sm:modal-middle" @close="onCatalogDialogClosed">
      <div class="modal-box grim-modal-box w-11/12 max-w-2xl p-4 sm:p-6 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        <button class="btn btn-sm btn-circle grim-modal-close absolute right-4 top-4" @click="closeCatalogModal" aria-label="Fermer">✕</button>
        <h3 class="grim-modal-title mb-4 pr-8 text-center text-2xl sm:text-3xl text-primary">Ajouter des {{ modalSectionLabel }}</h3>

				<div v-if="catalogSection === 'items'" class="mb-4 flex justify-center">
					<div class="join">
            <button
							type="button"
              class="btn btn-sm join-item ui-critical-action"
							:class="itemCatalogMode === 'search' ? 'btn-active' : ''"
							@click="itemCatalogMode = 'search'"
						>
							Recherche
						</button>
            <button
							type="button"
              class="btn btn-sm join-item ui-critical-action"
							:class="itemCatalogMode === 'create' ? 'btn-active' : ''"
							@click="itemCatalogMode = 'create'"
						>
							Création
						</button>
					</div>
				</div>

        <div class="space-y-4 overflow-y-auto pr-1">
					<template v-if="catalogSection === 'items' && itemCatalogMode === 'create'">
						<div class="grid gap-3">
							<label class="fieldset">
								<span class="fieldset-legend">Nom</span>
								<input
									v-model="newItemForm.name"
									type="text"
									class="input"
									maxlength="100"
									placeholder="Nom de l'équipement"
								/>
							</label>

							<label class="fieldset">
								<span class="fieldset-legend">Description</span>
								<textarea
									v-model="newItemForm.description"
									class="textarea min-h-24"
									maxlength="3000"
									placeholder="Description (optionnelle)"
								></textarea>
							</label>

							<div class="grid gap-3 sm:grid-cols-2">
								<label class="fieldset">
									<span class="fieldset-legend">Qualité</span>
									<select v-model="newItemForm.quality" class="select">
										<option v-for="quality in ITEM_QUALITY_OPTIONS" :key="quality" :value="quality">{{ quality }}</option>
									</select>
								</label>

								<label class="fieldset">
									<span class="fieldset-legend">Encombrement</span>
									<input
										v-model.number="newItemForm.encumbrance"
										type="number"
										min="0"
										class="input"
									/>
								</label>
							</div>

							<label class="fieldset">
								<span class="fieldset-legend">Quantité</span>
								<input
									v-model.number="newItemForm.quantity"
									type="number"
									min="1"
									class="input"
								/>
							</label>
						</div>
					</template>

					<template v-else>
						<!-- Search Input -->
            <div class="sticky top-0 z-10 bg-base-100/95 backdrop-blur py-1">
							<SearchInput
								v-model="catalogQuery"
								:placeholder="`Chercher des ${modalSectionLabel}`"
								class="w-full"
							/>
              <p class="mt-2 text-xs opacity-70">Saisissez au moins 2 caractères pour lancer la recherche.</p>
						</div>

            <div v-if="catalogSearchLoading" class="flex items-center gap-2 text-sm opacity-70">
              <span class="loading loading-spinner loading-xs" aria-hidden="true" />
              Recherche en cours...
            </div>

						<!-- Catalog Options List -->
            <div class="rounded-lg border border-base-300 bg-base-100 overflow-hidden">
              <div class="max-h-64 overflow-y-auto">
                <ul v-if="displayedCatalogOptions.length > 0" class="menu menu-compact">
									<li
                    v-for="option in displayedCatalogOptions"
										:key="option.id"
										:class="[
											'transition-colors border-l-4',
											selectedCatalogIds.includes(option.id)
												? 'bg-base-300 border-l-warning'
												: 'border-l-transparent hover:bg-base-200'
										]"
									>
										<label class="label cursor-pointer justify-start gap-3 px-4 py-3 rounded-none">
                      <input
												type="checkbox"
                        class="checkbox checkbox-md"
												:checked="selectedCatalogIds.includes(option.id)"
												@change="toggleCatalogSelection(option.id)"
											/>
											<div class="flex-1 min-w-0">
												<div class="flex flex-wrap items-center gap-2 min-w-0">
													<span class="font-medium break-words leading-tight">{{ formatCatalogOptionLabel(option) }}</span>
													<span
														v-if="selectedCatalogIds.includes(option.id)"
														class="badge badge-warning badge-sm"
													>
														Sélectionné
													</span>
												</div>
												<p v-if="option.specialization" class="text-xs opacity-60">{{ option.specialization }}</p>
											</div>
										</label>
									</li>
								</ul>
                <p v-else class="text-center text-sm opacity-70 py-8">{{ catalogQuery.trim().length < 2 ? 'Saisissez au moins 2 caracteres.' : 'Aucun element trouve.' }}</p>
							</div>
						</div>

            <p v-if="catalogOptions.length > displayedCatalogOptions.length" class="text-xs opacity-70 px-1">
              Affichage limité aux {{ displayedCatalogOptions.length }} premiers résultats. Précise votre recherche pour affiner.
            </p>

            <div
              v-if="catalogSection === 'items'"
              class="rounded-lg border border-base-300 bg-base-200 p-4"
            >
              <div class="mb-3">
                <p class="text-sm font-semibold">Paramètres appliqués à toute la sélection</p>
                <p class="text-xs opacity-70">La même qualité et la même quantité seront attribuées à tous les équipements sélectionnés.</p>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="fieldset">
                  <span class="fieldset-legend">Qualité</span>
                  <select v-model="selectedItemsQuality" class="select">
                    <option v-for="quality in ITEM_QUALITY_OPTIONS" :key="quality" :value="quality">{{ quality }}</option>
                  </select>
                </label>

                <label class="fieldset">
                  <span class="fieldset-legend">Quantité</span>
                  <input
                    v-model.number="selectedItemsQuantity"
                    type="number"
                    min="1"
                    class="input"
                  />
                </label>
              </div>
            </div>

						<!-- Selection Summary -->
						<div v-if="selectedCatalogIds.length > 0" class="rounded-lg border border-base-300 bg-base-200 p-4">
							<div class="flex flex-wrap items-center justify-between gap-2 mb-3">
								<p class="text-sm font-semibold">{{ selectedCatalogIds.length }} sélectionné(s)</p>
								<p class="text-xs opacity-70">Clique sur un badge pour le retirer.</p>
							</div>
							<div class="flex flex-wrap gap-2">
                <button
									v-for="selectedId in selectedCatalogIds"
									:key="selectedId"
									type="button"
                  class="btn btn-sm btn-outline btn-neutral h-auto min-h-11 max-w-full justify-start gap-2 px-3 py-2 normal-case whitespace-normal text-left"
									:aria-label="`Retirer ${selectedCatalogLabels[selectedId] || selectedId} de la sélection`"
									@click="removeCatalogSelection(selectedId)"
								>
									<span class="break-words">{{ selectedCatalogLabels[selectedId] || selectedId }}</span>
									<span aria-hidden="true" class="text-xs opacity-70">✕</span>
								</button>
							</div>
						</div>
					</template>
					</div>

					<!-- Error Message -->
					<div v-if="catalogError" role="alert" class="alert alert-error alert-soft">
						<span>{{ catalogError }}</span>
					</div>

          <!-- Action Buttons -->
          <div class="grim-modal-actions mt-3 border-t border-base-300 bg-base-100/95 backdrop-blur sticky bottom-0 flex items-center justify-end gap-3 pt-3">
            <button class="btn btn-sm btn-ghost ui-critical-action" @click="closeCatalogModal">Annuler</button>
						<button
							v-if="catalogSection === 'items' && itemCatalogMode === 'create'"
              class="btn btn-sm ui-critical-action"
							:disabled="creatingItem"
							@click="confirmItemCreate"
						>
							<span v-if="creatingItem" class="loading loading-spinner loading-xs" aria-hidden="true" />
							Créer et ajouter
						</button>
						<button
							v-else
              class="btn btn-sm ui-critical-action"
							:disabled="addingCatalog || selectedCatalogIds.length === 0"
							@click="confirmCatalogAdd"
						>
							<span v-if="addingCatalog" class="loading loading-spinner loading-xs" aria-hidden="true" />
							Ajouter ({{ selectedCatalogIds.length }})
						</button>
					</div>
				</div>

			<form method="dialog" class="modal-backdrop">
				<button>Fermer</button>
			</form>
		</dialog>

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
import { ChevronLeft, CircleX, LoaderCircle, Users } from '@lucide/vue'
import { useDebounceFn, useTimeoutFn } from '@vueuse/core'
import { useRouteParams } from '@vueuse/router'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { createCatalogItem, searchCatalog } from '../services/catalogRepository'
import {
  listCareerCharacteristicsByCareerId,
  listCareerPathCareersByFromCareerId,
  type CareerCharacteristic,
} from '../services/careersRepository'
import {
  addCharacterArmors,
  addCharacterItems,
  addCharacterSkills,
  addCharacterTalents,
  addCharacterWeapons,
  invalidateCharacterLinksCache,
  listCharacterLinksBundle,
  removeCharacterArmor,
  removeCharacterItem,
  removeCharacterSkill,
  removeCharacterTalent,
  removeCharacterWeapon,
  updateCharacterArmorEquipped,
  updateCharacterArmorQuality,
  updateCharacterItemQuality,
  updateCharacterItemQuantity,
  updateCharacterSkillMastery,
  updateCharacterWeaponEquipped,
  updateCharacterWeaponQuality,
} from '../services/characterLinksRepository'
import {
  getCharacterById,
  replaceCharacterTotalAdvancedValues,
  updateCharacterCareer,
  updateCharacterCore,
  updateCharacterStatValues,
} from '../services/charactersRepository'
import { useAuthStore } from '../stores/auth'
import { useLastActiveStore } from '../stores/lastActive'
import type {
  CatalogItem,
  CharacterArmor,
  CharacterDetail,
  CharacterItem,
  CharacterSkill,
  CharacterTalent,
  CharacterWeapon,
} from '../types/domain'
import type { CharacterQuickField, CharacterTabId } from '../types/characterSheet'
import type { WeaponHand, WeaponPreferredHand } from '../utils/equipmentSlots'
import CharacterInventoryPanel from '../components/character/CharacterInventoryPanel.vue'
import CharacterProfilePanel from '../components/character/CharacterProfilePanel.vue'
import CharacterSkillsPanel from '../components/character/CharacterSkillsPanel.vue'
import CharacterSummaryHeader from '../components/character/CharacterSummaryHeader.vue'
import CharacterTabs from '../components/character/CharacterTabs.vue'
import CharacterTalentsPanel from '../components/character/CharacterTalentsPanel.vue'
import SearchInput from '../components/ui/SearchInput.vue'
import { useConfirmAction } from '../composables/useConfirmAction'
import { useOptimisticUpdate } from '../composables/useOptimisticUpdate'
import { useMoneyCoercion } from '../composables/useMoneyCoercion'
import {
  type RealtimeUpdatePayload,
  useRealtimeChannels,
} from '../composables/useRealtimeChannels'
import {
  canEquipArmorStack,
  findConflictingWeapons,
  isTwoHandedWeapon,
  isWeaponHand,
  resolveWeaponEquipHand,
} from '../utils/equipmentSlots'
import {
  formatNamedWithSpecialization,
  sortStatsByCharacteristicOrder,
} from '../utils/characterSheet'
import { ITEM_QUALITY_OPTIONS, isInventoryQuality } from '../utils/inventoryQuality'
import { enqueueOfflineUpdate } from '../services/offlineQueueRepository'
import { isTransientError } from '../services/shared/networkErrors'

type CatalogSection = 'skills' | 'talents' | 'weapons' | 'armors' | 'items'

const CATALOG_LABELS: Record<CatalogSection, string> = {
  skills: 'compétences',
  talents: 'talents',
  weapons: 'armes',
  armors: 'armures',
  items: 'équipements',
}

const activeCharacterTab = ref<CharacterTabId>('profile')
const authStore = useAuthStore()
const lastActive = useLastActiveStore()
const { confirmAction } = useConfirmAction()
const { coerceMoney } = useMoneyCoercion()
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const character = ref<CharacterDetail | null>(null)
const characterId = useRouteParams('id', '', {
  transform: (value) => String(value ?? ''),
})
const isMoneyEditing = ref(false)

const careerDialogRef = ref<HTMLDialogElement | null>(null)
const careerConfirmDialogRef = ref<HTMLDialogElement | null>(null)
const careerQuery = ref('')
const careerOptions = ref<CatalogItem[]>([])
const careerPathOptions = ref<CatalogItem[]>([])
const careerFilterMode = ref<'paths' | 'all'>('paths')
const selectedCareerId = ref<string | null>(null)
const selectedCareerName = ref<string | null>(null)
const pendingCareerId = ref<string | null>(null)
const pendingCareerName = ref<string | null>(null)
const pendingCareerCharacteristics = ref<CareerCharacteristic[]>([])
const careerError = ref<string | null>(null)
const careerConfirmError = ref<string | null>(null)
const changingCareer = ref(false)

const catalogDialogRef = ref<HTMLDialogElement | null>(null)
const descriptionDialogRef = ref<HTMLDialogElement | null>(null)
const catalogSection = ref<CatalogSection>('skills')
const catalogQuery = ref('')
const catalogOptions = ref<CatalogItem[]>([])
const selectedCatalogIds = ref<string[]>([])
const selectedCatalogLabels = ref<Record<string, string>>({})
const catalogError = ref<string | null>(null)
const addingCatalog = ref(false)
const itemCatalogMode = ref<'search' | 'create'>('search')
const creatingItem = ref(false)
const MAX_CATALOG_RESULTS = 8
let catalogSearchSequence = 0
const selectedItemsQuality = ref<(typeof ITEM_QUALITY_OPTIONS)[number]>('normal')
const selectedItemsQuantity = ref(1)
const newItemForm = ref({
  name: '',
  description: '',
  quality: 'normal' as (typeof ITEM_QUALITY_OPTIONS)[number],
  encumbrance: 0,
  quantity: 1,
})
const descriptionTitle = ref<string | null>(null)
const descriptionContent = ref<string | null>(null)

const characterSkills = ref<CharacterSkill[]>([])
const characterTalents = ref<CharacterTalent[]>([])
const characterWeapons = ref<CharacterWeapon[]>([])
const characterArmors = ref<CharacterArmor[]>([])
const characterItems = ref<CharacterItem[]>([])
const actionSuccessMessage = ref<string | null>(null)
type FeedbackSection = 'skills' | 'talents' | 'weapons' | 'armors' | 'items' | 'stats' | 'career' | 'catalog'
const sectionSuccess = ref<{ section: FeedbackSection; message: string } | null>(null)
const careerSearchLoading = ref(false)
const careerPathLoading = ref(false)
const careerCharacteristicsLoading = ref(false)
const catalogSearchLoading = ref(false)
const actionBusyKey = ref<string | null>(null)

const editable = ref({
  pvMax: 0,
  pvCurrent: 0,
  fortuneMax: 0,
  fortuneCurrent: 0,
  destinyCurrent: 0,
  destinyMax: 0,
  xpTotal: 0,
  xpAvailable: 0,
  insanityPoints: 0,
  moneyGold: 0,
  moneySilver: 0,
  moneyCopper: 0,
})

const lastSavedEditable = ref({
  pvMax: 0,
  pvCurrent: 0,
  fortuneMax: 0,
  fortuneCurrent: 0,
  destinyCurrent: 0,
  destinyMax: 0,
  xpTotal: 0,
  xpAvailable: 0,
  insanityPoints: 0,
  moneyGold: 0,
  moneySilver: 0,
  moneyCopper: 0,
})

const canEditQuickSection = computed(() =>
  Boolean(character.value && authStore.user?.id === character.value.userId)
)
const modalSectionLabel = computed(() => CATALOG_LABELS[catalogSection.value])
const scheduleDeferredLinksReload = useDebounceFn((currentCharacterId: string) => {
  void loadCharacterLinks(currentCharacterId, { force: true })
}, 700)
const scheduleDeferredRealtimeReload = useDebounceFn(() => {
  void loadCharacter({ background: true })
}, 700)
const scheduleCatalogSearch = useDebounceFn(
  async (trimmed: string, requestId: number, section: CatalogSection) => {
    catalogSearchLoading.value = true
    try {
      const results = await searchCatalog(section, trimmed)
      if (requestId !== catalogSearchSequence) {
        return
      }

      catalogOptions.value = results
    } catch {
      if (requestId !== catalogSearchSequence) {
        return
      }

      catalogOptions.value = []
    } finally {
      if (requestId === catalogSearchSequence) {
        catalogSearchLoading.value = false
      }
    }
  },
  180
)
const { start: startActionSuccessReset, stop: stopActionSuccessReset } = useTimeoutFn(
  () => {
    actionSuccessMessage.value = null
  },
  4000,
  { immediate: false }
)
const { start: startSectionSuccessReset, stop: stopSectionSuccessReset } = useTimeoutFn(
  () => {
    sectionSuccess.value = null
  },
  4500,
  { immediate: false }
)

function sortByName<T extends { name: string }>(entries: T[]): T[] {
  return [...entries].sort((left, right) =>
    left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' })
  )
}

const sortedCharacterSkills = computed(() => sortByName(characterSkills.value))
const sortedCharacterTalents = computed(() => sortByName(characterTalents.value))
const sortedCharacterWeapons = computed(() => sortByName(characterWeapons.value))
const sortedCharacterArmors = computed(() => sortByName(characterArmors.value))
const sortedCharacterItems = computed(() => sortByName(characterItems.value))
const displayedCatalogOptions = computed(() => catalogOptions.value.slice(0, MAX_CATALOG_RESULTS))

const { status, update: triggerSave, flush: triggerSaveNow } = useOptimisticUpdate<
  typeof editable.value
>({
  onSave: async (payload) => {
    if (!character.value) {
      return
    }

    const normalizedPayload = {
      ...editable.value,
      ...payload,
    }

    await updateCharacterCore(character.value.id, {
      pv_current: normalizedPayload.pvCurrent,
      fortune_max: normalizedPayload.fortuneMax,
      fortune_current: normalizedPayload.fortuneCurrent,
      destiny_current: normalizedPayload.destinyCurrent,
      destiny_max: normalizedPayload.destinyMax,
      xp_total: normalizedPayload.xpTotal,
      xp_available: Math.min(normalizedPayload.xpAvailable, normalizedPayload.xpTotal),
      insanity_points: Math.max(0, normalizedPayload.insanityPoints),
      money_gold: normalizedPayload.moneyGold,
      money_silver: normalizedPayload.moneySilver,
      money_copper: normalizedPayload.moneyCopper
    })
    try {
      markSavedEditable(normalizedPayload)
    } catch (error) {
      if (!isTransientError(error)) {
        throw error
      }

      await enqueueOfflineUpdate({
        entityType: 'character',
        entityId: character.value.id,
        payload: {
          kind: 'character-core',
          patch: normalizedPayload,
        },
        baseUpdatedAt: null,
        localUpdatedAt: Date.now(),
      })
      markSavedEditable(normalizedPayload)
    }
  },
  debounceMs: 500,
})

const {
  status: statSaveStatus,
  update: triggerStatSave,
} = useOptimisticUpdate<{
    statCode: string
    currentAdvanced?: number
    baseValue?: number
    totalAdvanced?: number
  }>({
  onSave: async (payload) => {
    if (!character.value) {
      return
    }

    if (!payload.statCode) {
      return
    }

    if (!payload.statCode) {
      return
    }

    try {
      await updateCharacterStatValues(character.value.id, payload.statCode, {
        current_advanced: payload.currentAdvanced,
        base_value: payload.baseValue,
        total_advanced: payload.totalAdvanced,
      })
    } catch (error) {
      if (!isTransientError(error)) {
        throw error
      }

      await enqueueOfflineUpdate({
        entityType: 'character',
        entityId: character.value.id,
        payload: {
          kind: 'character-stat',
          statCode: payload.statCode,
          patch: {
            currentAdvanced: payload.currentAdvanced,
            baseValue: payload.baseValue,
            totalAdvanced: payload.totalAdvanced,
          },
        },
        baseUpdatedAt: null,
        localUpdatedAt: Date.now(),
      })
    }
  },
  debounceMs: 350,
})

const globalState = computed<'ok' | 'loading' | 'error'>(() => {
  if (status.value === 'error' || statSaveStatus.value === 'error') {
    return 'error'
  }
  if (
    status.value === 'saving' ||
    status.value === 'pending' ||
    statSaveStatus.value === 'saving' ||
    statSaveStatus.value === 'pending'
  ) {
    return 'loading'
  }

  return 'ok'
})

const globalStateLabel = computed(() => {
  if (globalState.value === 'error') {
    return 'Erreur de sauvegarde'
  }
  if (globalState.value === 'loading') {
    return 'Mise à jour...'
  }

  return ''
})

function isEditableEqual(
  left: typeof editable.value,
  right: typeof lastSavedEditable.value
): boolean {
  return (
    left.pvMax === right.pvMax &&
    left.pvCurrent === right.pvCurrent &&
    left.fortuneMax === right.fortuneMax &&
    left.fortuneCurrent === right.fortuneCurrent &&
    left.destinyCurrent === right.destinyCurrent &&
    left.destinyMax === right.destinyMax &&
    left.xpTotal === right.xpTotal &&
    left.xpAvailable === right.xpAvailable &&
    left.insanityPoints === right.insanityPoints &&
    left.moneyGold === right.moneyGold &&
    left.moneySilver === right.moneySilver &&
    left.moneyCopper === right.moneyCopper
  )
}

function markSavedEditable(snapshot: typeof editable.value): void {
  lastSavedEditable.value = { ...snapshot }
}

function isSavingInProgress(): boolean {
  return (
    status.value === 'pending' ||
    status.value === 'saving' ||
    statSaveStatus.value === 'pending' ||
    statSaveStatus.value === 'saving'
  )
}

function getWoundsValueFromCharacterStats(): number {
  if (!character.value) {
    return 0
  }

  const woundsStat = character.value.stats.find(
    (stat) => stat.statCode.trim().toUpperCase() === 'B'
  )

  return Math.max(
    0,
    Math.floor((woundsStat?.baseValue ?? 0) + (woundsStat?.currentAdvanced ?? 0))
  )
}

function syncEditablePvFromWoundsValue(): void {
  const woundsMax = getWoundsValueFromCharacterStats()
  editable.value.pvMax = woundsMax
  if (editable.value.pvCurrent > woundsMax) {
    editable.value.pvCurrent = woundsMax
  }
}

function invalidateCurrentLinksCache(): void {
  const currentCharacterId = character.value?.id ?? characterId.value
  if (!currentCharacterId) {
    return
  }

  invalidateCharacterLinksCache(currentCharacterId)
}

const allStatsSorted = computed(() =>
  character.value ? sortStatsByCharacteristicOrder(character.value.stats) : []
)

const pendingCareerCharacteristicRows = computed(() => {
  const valuesByCode = new Map(
    pendingCareerCharacteristics.value.map((entry) => [entry.statCode.toUpperCase(), entry.value])
  )
  const orderedCodes = allStatsSorted.value.map((entry) => entry.statCode.toUpperCase())
  const unknownCodes = Array.from(valuesByCode.keys()).filter((code) => !orderedCodes.includes(code))
  unknownCodes.sort((left, right) => left.localeCompare(right, 'fr', { sensitivity: 'base' }))

  return [...orderedCodes, ...unknownCodes].map((statCode) => ({
    statCode,
    value: valuesByCode.get(statCode) ?? 0,
  }))
})

const LINK_TABLES = new Set([
  'character_skills',
  'character_talents',
  'character_weapons',
  'character_armors',
  'character_items',
])

function requestExternalCharacterRefresh(update?: RealtimeUpdatePayload): void {
  const table = update?.table
  const currentCharacterId = character.value?.id ?? characterId.value
  if (!currentCharacterId) {
    return
  }

  if (table && LINK_TABLES.has(table)) {
    invalidateCharacterLinksCache(currentCharacterId)

    if (isSavingInProgress()) {
      void scheduleDeferredLinksReload(currentCharacterId)
      return
    }

    void loadCharacterLinks(currentCharacterId, { force: true })
    return
  }

  if (isSavingInProgress()) {
    void scheduleDeferredRealtimeReload()
    return
  }

  void loadCharacter({ background: true })
}

const { subscribe: subscribeRealtime, unsubscribe: unsubscribeRealtime } = useRealtimeChannels(
  (update) => {
    requestExternalCharacterRefresh(update)
  },
  { debounceMs: 450 }
)

async function loadCharacterLinks(
  characterId: string,
  options: { force?: boolean } = {}
): Promise<void> {
  const links = await listCharacterLinksBundle(characterId, options)
  characterSkills.value = links.skills
  characterTalents.value = links.talents
  characterWeapons.value = links.weapons
  characterArmors.value = links.armors
  characterItems.value = links.items
}

async function loadCharacter(options: { background?: boolean } = {}): Promise<void> {
  const currentCharacterId = characterId.value
  if (!currentCharacterId) {
    errorMessage.value = 'Personnage invalide.'
    return
  }

  const isBackgroundRefresh = Boolean(options.background && character.value)
  if (!isBackgroundRefresh) {
    loading.value = true
    errorMessage.value = null
  }
  try {
    const data = await getCharacterById(currentCharacterId)
    character.value = data

    if (!data) {
      errorMessage.value = 'Personnage introuvable.'
      return
    }

    // Another player's sheet only refreshes the campaign, never the "own character" shortcut.
    if (data.userId === authStore.user?.id) {
      lastActive.setCharacter(data.campaignId, data.id)
    } else {
      lastActive.setCampaign(data.campaignId)
    }

    const nextEditable = {
      pvMax: data.pvMax,
      pvCurrent: data.pvCurrent,
      fortuneMax: data.fortuneMax,
      fortuneCurrent: data.fortuneCurrent,
      destinyCurrent: data.destinyCurrent,
      destinyMax: data.destinyMax,
      xpTotal: data.xpTotal,
      xpAvailable: data.xpAvailable,
      insanityPoints: data.insanityPoints,
      moneyGold: data.moneyGold,
      moneySilver: data.moneySilver,
      moneyCopper: data.moneyCopper,
    }

    if (isBackgroundRefresh && isMoneyEditing.value) {
      nextEditable.moneyGold = editable.value.moneyGold
      nextEditable.moneySilver = editable.value.moneySilver
      nextEditable.moneyCopper = editable.value.moneyCopper
    }

    editable.value = nextEditable
    syncEditablePvFromWoundsValue()
    markSavedEditable({ ...editable.value })

    await loadCharacterLinks(data.id)
  } catch (error) {
    if (!isBackgroundRefresh || !character.value) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Impossible de charger le personnage.'
    }
  } finally {
    if (!isBackgroundRefresh) {
      loading.value = false
    }
  }
}

function onQuickValueChange(field: CharacterQuickField, value: number): void {
  const previousValue = editable.value[field]
  const newValue = Math.max(0, value)
  const isMoneyField = field === 'moneyGold' || field === 'moneySilver' || field === 'moneyCopper'

  // Constraint: current <= max for resource types
  if (field === 'pvCurrent' && editable.value.pvMax !== undefined) {
    editable.value[field] = Math.min(newValue, editable.value.pvMax) as never
  } else if (field === 'fortuneCurrent' && editable.value.fortuneMax !== undefined) {
    editable.value[field] = Math.min(newValue, editable.value.fortuneMax) as never
  } else if (field === 'destinyCurrent' && editable.value.destinyMax !== undefined) {
    editable.value[field] = Math.min(newValue, editable.value.destinyMax) as never
  } else if (field === 'fortuneMax') {
    editable.value[field] = newValue as never
    editable.value.fortuneCurrent = Math.min(editable.value.fortuneCurrent, newValue)
  } else if (field === 'destinyMax') {
    editable.value[field] = newValue as never
    editable.value.destinyCurrent = Math.min(editable.value.destinyCurrent, newValue)
  } else {
    editable.value[field] = newValue as never
  }

  if (editable.value[field] === previousValue) {
    return
  }

  if (isMoneyField) {
    isMoneyEditing.value = true
  }

  if (!isMoneyField) {
    saveQuickFields()
  }
}

async function onMoneyCommit(): Promise<void> {
  if (!canEditQuickSection.value) {
    return
  }

  await saveQuickFields({ immediate: true })
  isMoneyEditing.value = false
}

function onMoneySubtract(value: { silver: number; copper: number }): void {
  if (!canEditQuickSection.value) {
    return
  }

  const currentCopper =
    Math.max(0, Math.floor(editable.value.moneyGold)) * 240 +
    Math.max(0, Math.floor(editable.value.moneySilver)) * 20 +
    Math.max(0, Math.floor(editable.value.moneyCopper))

  const subtractCopper =
    Math.max(0, Math.floor(value.silver)) * 20 + Math.max(0, Math.floor(value.copper))

  const remainingCopper = Math.max(0, currentCopper - subtractCopper)
  const normalized = coerceMoney(0, 0, remainingCopper)

  editable.value.moneyGold = normalized.gold
  editable.value.moneySilver = normalized.silver
  editable.value.moneyCopper = normalized.copper
  isMoneyEditing.value = false

  void saveQuickFields({ immediate: true })
}

function onStatTick(statCode: string, step: number): void {
  if (!character.value || !canEditQuickSection.value) {
    return
  }

  const target = character.value.stats.find((stat) => stat.statCode === statCode)
  if (!target) {
    return
  }

  const nextAdvanced = Math.max(0, target.currentAdvanced + step)
  target.currentAdvanced = nextAdvanced

  if (statCode.trim().toUpperCase() === 'B') {
    syncEditablePvFromWoundsValue()
  }

  triggerStatSave({ statCode, currentAdvanced: nextAdvanced })
}

function onStatBaseChange(statCode: string, baseValue: number): void {
  if (!character.value || !canEditQuickSection.value) {
    return
  }

  const target = character.value.stats.find((stat) => stat.statCode === statCode)
  if (!target) {
    return
  }

  const nextBase = Math.max(0, baseValue)
  if (nextBase === target.baseValue) {
    return
  }

  target.baseValue = nextBase

  if (statCode.trim().toUpperCase() === 'B') {
    syncEditablePvFromWoundsValue()
  }

  triggerStatSave({ statCode, baseValue: nextBase })
}

function onStatTotalAdvancedChange(statCode: string, totalAdvanced: number): void {
  if (!character.value || !canEditQuickSection.value) {
    return
  }

  const target = character.value.stats.find((stat) => stat.statCode === statCode)
  if (!target) {
    return
  }

  const nextTotalAdvanced = Math.max(0, totalAdvanced)
  if (nextTotalAdvanced === target.totalAdvanced) {
    return
  }

  target.totalAdvanced = nextTotalAdvanced

  triggerStatSave({ statCode, totalAdvanced: nextTotalAdvanced })
}

async function onChangeSkillMastery(skillId: string, level: 1 | 2 | 3): Promise<void> {
  if (!character.value || !canEditQuickSection.value) {
    return
  }

  const currentCharacter = character.value

  const target = characterSkills.value.find((skill) => skill.skillId === skillId)
  if (target && target.masteryLevel === level) {
    return
  }

  await runWithBusyAction(`mastery-${skillId}`, async () => {
    try {
      await updateCharacterSkillMastery(currentCharacter.id, skillId, level)
      if (target) {
        target.masteryLevel = level
      }
      invalidateCurrentLinksCache()
      setSectionSuccess('skills', 'Niveau de maitrise mis a jour.')
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Modification du niveau de maitrise impossible.'
    }
  })
}

async function onDeleteSkill(skillId: string): Promise<void> {
  if (!character.value || !canEditQuickSection.value || actionBusyKey.value) {
    return
  }

  if (!(await confirmDestructiveAction('Supprimer cette competence ?'))) {
    return
  }

  actionBusyKey.value = `skill-${skillId}`
  try {
    await removeCharacterSkill(character.value.id, skillId)
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
    setSectionSuccess('skills', 'Competence supprimee.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
  } finally {
    endAction()
  }
}

async function onDeleteTalent(talentId: string): Promise<void> {
  if (!character.value || !canEditQuickSection.value || actionBusyKey.value) {
    return
  }

  if (!(await confirmDestructiveAction('Supprimer ce talent ?'))) {
    return
  }

  actionBusyKey.value = `talent-${talentId}`
  try {
    await removeCharacterTalent(character.value.id, talentId)
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
    setSectionSuccess('talents', 'Talent supprime.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
  } finally {
    endAction()
  }
}

async function onDeleteWeapon(linkId: string): Promise<void> {
  if (!canEditQuickSection.value || !character.value || actionBusyKey.value) {
    return
  }

  if (!(await confirmDestructiveAction('Supprimer cette arme ?'))) {
    return
  }

  actionBusyKey.value = `weapon-${linkId}`
  try {
    await removeCharacterWeapon(linkId)
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
    setSectionSuccess('weapons', 'Arme supprimee.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
  } finally {
    endAction()
  }
}

async function onWeaponStateChange(
  weapon: CharacterWeapon,
  value: string | boolean | null
): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  if (value !== null && !isWeaponHand(value)) {
    return
  }

  let nextEquipped: WeaponHand | null = value
  if (nextEquipped === 'd&g' && !isTwoHandedWeapon(weapon)) {
    nextEquipped = 'droite'
  } else if ((nextEquipped === 'droite' || nextEquipped === 'gauche') && isTwoHandedWeapon(weapon)) {
    nextEquipped = 'd&g'
  }

  if (weapon.equipped === nextEquipped) {
    return
  }

  if (!beginAction(`weapon-state-${weapon.id}`)) {
    return
  }

  try {
    if (nextEquipped !== null) {
      const conflicts = findConflictingWeapons(characterWeapons.value, weapon.id, nextEquipped)
      for (const conflict of conflicts) {
        await updateCharacterWeaponEquipped(conflict.id, null)
        conflict.equipped = null
      }
    }

    await updateCharacterWeaponEquipped(weapon.id, nextEquipped)
    weapon.equipped = nextEquipped
    invalidateCurrentLinksCache()
    setSectionSuccess('weapons', 'Etat de l arme mis a jour.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
  } finally {
    endAction()
  }
}

async function onWeaponQualityChange(
  weapon: CharacterWeapon,
  quality: string | boolean | null
): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  const currentCharacter = character.value

  if (!isInventoryQuality(quality)) {
    return
  }

  if (quality === weapon.quality) {
    return
  }

  await runWithBusyAction(`weapon-quality-${weapon.id}`, async () => {
    try {
      await updateCharacterWeaponQuality(weapon.id, quality)
      invalidateCurrentLinksCache()
      await loadCharacterLinks(currentCharacter.id, { force: true })
      setSectionSuccess('weapons', 'Qualite de l arme mise a jour.')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
    }
  })
}

async function onDeleteArmor(linkId: string): Promise<void> {
  if (!canEditQuickSection.value || !character.value || actionBusyKey.value) {
    return
  }

  if (!(await confirmDestructiveAction('Supprimer cette armure ?'))) {
    return
  }

  actionBusyKey.value = `armor-${linkId}`
  try {
    await removeCharacterArmor(linkId)
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
    setSectionSuccess('armors', 'Armure supprimee.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
  } finally {
    endAction()
  }
}

function ensureArmorCanBeEquipped(armor: CharacterArmor): boolean {
  if (canEquipArmorStack(characterArmors.value, armor)) {
    return true
  }
  errorMessage.value = 'Maximum 3 couches d’armure atteint sur une localisation couverte.'
  return false
}

async function onEquipArmorFromDoll(armorId: string): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  const armor = characterArmors.value.find((item) => item.id === armorId)
  if (!armor || armor.isEquipped) {
    return
  }

  if (!ensureArmorCanBeEquipped(armor)) {
    return
  }

  if (!beginAction(`armor-equip-doll-${armor.id}`)) {
    return
  }

  try {
    await updateCharacterArmorEquipped(armor.id, true)
    armor.isEquipped = true
    invalidateCurrentLinksCache()
    setSectionSuccess('armors', 'Armure équipée (couche ajoutée).')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
  } finally {
    endAction()
  }
}

async function onUnequipArmorFromDoll(armorId: string): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  const armor = characterArmors.value.find((item) => item.id === armorId)
  if (!armor || !armor.isEquipped) {
    return
  }

  if (!beginAction(`armor-unequip-doll-${armor.id}`)) {
    return
  }

  try {
    await updateCharacterArmorEquipped(armor.id, false)
    armor.isEquipped = false
    invalidateCurrentLinksCache()
    setSectionSuccess('armors', 'Armure déséquipée.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
  } finally {
    endAction()
  }
}

async function onUnequipArmorsFromDoll(armorIds: string[]): Promise<void> {
  if (!canEditQuickSection.value || !character.value || armorIds.length === 0) {
    return
  }

  const armorsToUnequip = armorIds
    .map((id) => characterArmors.value.find((item) => item.id === id))
    .filter((armor): armor is CharacterArmor => Boolean(armor?.isEquipped))

  if (armorsToUnequip.length === 0) {
    return
  }

  if (!beginAction('armor-unequip-doll-batch')) {
    return
  }

  try {
    for (const armor of armorsToUnequip) {
      await updateCharacterArmorEquipped(armor.id, false)
      armor.isEquipped = false
    }
    invalidateCurrentLinksCache()
    setSectionSuccess(
      'armors',
      armorsToUnequip.length > 1 ? 'Couches d’armure déséquipées.' : 'Armure déséquipée.'
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
  } finally {
    endAction()
  }
}

async function onEquipWeaponFromDoll(
  weaponId: string,
  hand: WeaponHand
): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  const weapon = characterWeapons.value.find((item) => item.id === weaponId)
  if (!weapon) {
    return
  }

  const preferredHand: WeaponPreferredHand = hand === 'gauche' ? 'gauche' : 'droite'
  const resolvedHand = resolveWeaponEquipHand(weapon, preferredHand)

  if (weapon.equipped === resolvedHand) {
    return
  }

  if (!beginAction(`weapon-equip-doll-${weapon.id}`)) {
    return
  }

  const conflicts = findConflictingWeapons(characterWeapons.value, weapon.id, resolvedHand)

  try {
    for (const conflict of conflicts) {
      await updateCharacterWeaponEquipped(conflict.id, null)
      conflict.equipped = null
    }

    await updateCharacterWeaponEquipped(weapon.id, resolvedHand)
    weapon.equipped = resolvedHand
    invalidateCurrentLinksCache()
    setSectionSuccess(
      'weapons',
      conflicts.length > 0 ? 'Arme équipée (remplacement).' : 'Arme équipée.'
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
  } finally {
    endAction()
  }
}

async function onUnequipWeaponFromDoll(weaponId: string): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  const weapon = characterWeapons.value.find((item) => item.id === weaponId)
  if (!weapon || weapon.equipped === null) {
    return
  }

  if (!beginAction(`weapon-unequip-doll-${weapon.id}`)) {
    return
  }

  try {
    await updateCharacterWeaponEquipped(weapon.id, null)
    weapon.equipped = null
    invalidateCurrentLinksCache()
    setSectionSuccess('weapons', 'Arme déséquipée.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
  } finally {
    endAction()
  }
}

async function onArmorStateChange(
  armor: CharacterArmor,
  value: string | boolean | null
): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  if (typeof value !== 'boolean') {
    return
  }

  const nextEquipped = value
  if (armor.isEquipped === nextEquipped) {
    return
  }

  if (nextEquipped && !ensureArmorCanBeEquipped(armor)) {
    return
  }

  if (!beginAction(`armor-state-${armor.id}`)) {
    return
  }

  try {
    await updateCharacterArmorEquipped(armor.id, nextEquipped)
    armor.isEquipped = nextEquipped
    invalidateCurrentLinksCache()
    setSectionSuccess('armors', 'Etat de l armure mis a jour.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
  } finally {
    endAction()
  }
}

async function onArmorQualityChange(
  armor: CharacterArmor,
  quality: string | boolean | null
): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  const currentCharacter = character.value

  if (!isInventoryQuality(quality)) {
    return
  }

  if (quality === armor.quality) {
    return
  }

  await runWithBusyAction(`armor-quality-${armor.id}`, async () => {
    try {
      await updateCharacterArmorQuality(armor.id, quality)
      invalidateCurrentLinksCache()
      await loadCharacterLinks(currentCharacter.id, { force: true })
      setSectionSuccess('armors', 'Qualite de l armure mise a jour.')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
    }
  })
}

function resetNewItemForm(): void {
  newItemForm.value = {
    name: '',
    description: '',
    quality: 'normal',
    encumbrance: 0,
    quantity: 1,
  }
}

function resetSelectedItemsSettings(): void {
  selectedItemsQuality.value = 'normal'
  selectedItemsQuantity.value = 1
}

async function onDeleteItem(linkId: string): Promise<void> {
  if (!canEditQuickSection.value || !character.value || actionBusyKey.value) {
    return
  }

  if (!(await confirmDestructiveAction('Supprimer cet equipement ?'))) {
    return
  }

  actionBusyKey.value = `item-${linkId}`
  try {
    await removeCharacterItem(linkId)
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
    setSectionSuccess('items', 'Equipement supprime.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
  } finally {
    endAction()
  }
}

async function onChangeItemQuantity(item: CharacterItem, delta: number): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  const nextQuantity = Math.max(1, item.quantity + delta)
  if (nextQuantity === item.quantity) {
    return
  }

  if (!beginAction(`item-qty-${item.id}`)) {
    return
  }

  try {
    await updateCharacterItemQuantity(item.id, nextQuantity)
    item.quantity = nextQuantity
    invalidateCurrentLinksCache()
    setSectionSuccess('items', 'Quantite mise a jour.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
  } finally {
    endAction()
  }
}

async function onItemQualityChange(
  item: CharacterItem,
  quality: string | boolean | null
): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  if (!isInventoryQuality(quality)) {
    return
  }

  if (quality === item.quality) {
    return
  }

  await runWithBusyAction(`item-quality-${item.id}`, async () => {
    try {
      await updateCharacterItemQuality(item.id, quality)
      item.quality = quality
      invalidateCurrentLinksCache()
      setSectionSuccess('items', 'Qualite de l equipement mise a jour.')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
    }
  })
}

async function refreshCareerOptions(): Promise<void> {
  const trimmed = careerQuery.value.trim()

  if (careerFilterMode.value === 'paths') {
    careerSearchLoading.value = false
    const normalizedQuery = trimmed.toLocaleLowerCase('fr')
    if (!normalizedQuery) {
      careerOptions.value = [...careerPathOptions.value]
      return
    }

    careerOptions.value = careerPathOptions.value.filter((option) =>
      option.name.toLocaleLowerCase('fr').includes(normalizedQuery)
    )
    return
  }

  if (trimmed.length < 2) {
    careerSearchLoading.value = false
    careerOptions.value = []
    return
  }

  careerSearchLoading.value = true
  try {
    careerOptions.value = await searchCatalog('careers', trimmed)
  } catch {
    careerOptions.value = []
  } finally {
    careerSearchLoading.value = false
  }
}

async function loadCareerPathOptions(): Promise<void> {
  if (!character.value?.careerId) {
    careerPathOptions.value = []
    return
  }

  careerPathLoading.value = true
  try {
    const paths = await listCareerPathCareersByFromCareerId(character.value.careerId)
    careerPathOptions.value = paths.map((path) => ({
      id: path.id,
      name: path.name,
      description: null,
      specialization: null,
      encumbrance: null,
      damageFormula: null,
      armorPoints: null,
    }))
  } finally {
    careerPathLoading.value = false
  }
}

async function openCareerModal(): Promise<void> {
  careerError.value = null
  careerConfirmError.value = null
  selectedCareerId.value = null
  selectedCareerName.value = null
  careerFilterMode.value = 'paths'
  careerQuery.value = ''
  careerOptions.value = []
  careerPathOptions.value = []
  careerSearchLoading.value = false
  careerPathLoading.value = false
  careerCharacteristicsLoading.value = false

  try {
    await loadCareerPathOptions()
    await refreshCareerOptions()
  } catch (error) {
    careerError.value =
      error instanceof Error ? error.message : 'Chargement des débouchés impossible.'
  }

  if (!careerDialogRef.value) {
    return
  }

  careerDialogRef.value.showModal()
}

function closeCareerModal(): void {
  if (careerDialogRef.value?.open) {
    careerDialogRef.value.close()
    return
  }
  resetCareerModalState()
}

function resetCareerModalState(): void {
  selectedCareerId.value = null
  selectedCareerName.value = null
  careerError.value = null
  careerSearchLoading.value = false
  careerPathLoading.value = false
}

function onCareerDialogClosed(): void {
  resetCareerModalState()
}

function selectCareer(id: string, name: string): void {
  selectedCareerId.value = id
  selectedCareerName.value = name
  careerError.value = null
}

function resetPendingCareerChange(): void {
  pendingCareerId.value = null
  pendingCareerName.value = null
  pendingCareerCharacteristics.value = []
  careerConfirmError.value = null
}

function closeCareerConfirmModal(): void {
  if (careerConfirmDialogRef.value?.open) {
    careerConfirmDialogRef.value.close()
    return
  }
  careerCharacteristicsLoading.value = false
  resetPendingCareerChange()
}

function onCareerConfirmDialogClosed(): void {
  careerCharacteristicsLoading.value = false
  resetPendingCareerChange()
}

async function confirmCareerChange(): Promise<void> {
  if (!character.value || !canEditQuickSection.value || changingCareer.value) {
    return
  }

  if (!selectedCareerId.value) {
    careerError.value = 'Veuillez sélectionner une carrière.'
    return
  }

  if (selectedCareerId.value === character.value.careerId) {
    closeCareerModal()
    return
  }

  careerError.value = null
  careerConfirmError.value = null
  careerCharacteristicsLoading.value = true
  try {
    pendingCareerId.value = selectedCareerId.value
    pendingCareerName.value = selectedCareerName.value
    pendingCareerCharacteristics.value = await listCareerCharacteristicsByCareerId(selectedCareerId.value)
    closeCareerModal()
    careerConfirmDialogRef.value?.showModal()
  } catch (error) {
    careerError.value =
      error instanceof Error ? error.message : 'Modification de carrière impossible.'
  } finally {
    careerCharacteristicsLoading.value = false
  }
}

async function applyCareerChange(applyCareerCharacteristics: boolean): Promise<void> {
  if (!character.value || !pendingCareerId.value || changingCareer.value) {
    return
  }

  changingCareer.value = true
  careerConfirmError.value = null
  let careerUpdated = false

  try {
    await updateCharacterCareer(character.value.id, pendingCareerId.value)
    careerUpdated = true

    if (applyCareerCharacteristics) {
      const totalAdvancedByStatCode = pendingCareerCharacteristics.value.reduce<
        Record<string, number>
      >((accumulator, entry) => {
        accumulator[entry.statCode] = entry.value
        return accumulator
      }, {})
      await replaceCharacterTotalAdvancedValues(character.value.id, totalAdvancedByStatCode)
    }

    await loadCharacter()
    setSectionSuccess(
      'career',
      applyCareerCharacteristics
        ? 'Carriere et caracteristiques mises a jour.'
        : 'Carriere mise a jour.'
    )
    closeCareerConfirmModal()
  } catch (error) {
    if (careerUpdated) {
      await loadCharacter().catch(() => undefined)
      careerConfirmError.value =
        error instanceof Error
          ? `Carriere mise a jour, mais profil de carriere non applique: ${error.message}`
          : 'Carriere mise a jour, mais profil de carriere non applique.'
      return
    }

    careerConfirmError.value =
      error instanceof Error ? error.message : 'Modification de carrière impossible.'
  } finally {
    changingCareer.value = false
  }
}

function openCatalogModal(section: CatalogSection): void {
  catalogSection.value = section
  catalogQuery.value = ''
  catalogOptions.value = []
  selectedCatalogIds.value = []
  selectedCatalogLabels.value = {}
  catalogError.value = null
  catalogSearchLoading.value = false
  itemCatalogMode.value = 'search'
  creatingItem.value = false
  resetSelectedItemsSettings()
  resetNewItemForm()
  if (!catalogDialogRef.value) {
    return
  }

  catalogDialogRef.value.showModal()
}

function openDescriptionModal(title: string, description: string | null): void {
  descriptionTitle.value = title
  descriptionContent.value = description?.trim() ?? null
  descriptionDialogRef.value?.showModal()
}

function closeDescriptionModal(): void {
  if (descriptionDialogRef.value?.open) {
    descriptionDialogRef.value.close()
    return
  }
  resetDescriptionModalState()
}

function resetDescriptionModalState(): void {
  descriptionTitle.value = null
  descriptionContent.value = null
}

function onDescriptionDialogClosed(): void {
  resetDescriptionModalState()
}

function closeCatalogModal(): void {
  if (catalogDialogRef.value?.open) {
    catalogDialogRef.value.close()
    return
  }
  resetCatalogModalState()
}

function resetCatalogModalState(): void {
  selectedCatalogIds.value = []
  selectedCatalogLabels.value = {}
  catalogError.value = null
  catalogSearchLoading.value = false
  itemCatalogMode.value = 'search'
  creatingItem.value = false
  resetSelectedItemsSettings()
  resetNewItemForm()
}

function onCatalogDialogClosed(): void {
  resetCatalogModalState()
}

function toggleCatalogSelection(id: string): void {
  if (selectedCatalogIds.value.includes(id)) {
    removeCatalogSelection(id)
    return
  }

  const option = catalogOptions.value.find((candidate) => candidate.id === id)
  if (option) {
    selectedCatalogLabels.value = {
      ...selectedCatalogLabels.value,
      [id]: formatCatalogOptionLabel(option),
    }
  }

  selectedCatalogIds.value = [...selectedCatalogIds.value, id]
  catalogQuery.value = ''
  catalogOptions.value = []
}

function removeCatalogSelection(id: string): void {
  selectedCatalogIds.value = selectedCatalogIds.value.filter((selectedId) => selectedId !== id)
  const nextLabels = { ...selectedCatalogLabels.value }
  delete nextLabels[id]
  selectedCatalogLabels.value = nextLabels
}

async function confirmCatalogAdd(): Promise<void> {
  if (!character.value || !canEditQuickSection.value || addingCatalog.value) {
    return
  }

  if (selectedCatalogIds.value.length === 0) {
    catalogError.value = 'Veuillez sélectionner au moins un élément.'
    return
  }

  if (
    !(await confirmDestructiveAction(
      `Ajouter ${selectedCatalogIds.value.length} element(s) a la fiche ?`
    ))
  ) {
    return
  }

  addingCatalog.value = true
  catalogError.value = null
  try {
    if (catalogSection.value === 'skills') {
      await addCharacterSkills(character.value.id, selectedCatalogIds.value)
    } else if (catalogSection.value === 'talents') {
      await addCharacterTalents(character.value.id, selectedCatalogIds.value)
    } else if (catalogSection.value === 'weapons') {
      await addCharacterWeapons(character.value.id, selectedCatalogIds.value)
    } else if (catalogSection.value === 'armors') {
      await addCharacterArmors(character.value.id, selectedCatalogIds.value)
    } else if (catalogSection.value === 'items') {
      await addCharacterItems(
        character.value.id,
        selectedCatalogIds.value,
        Math.max(1, Math.floor(selectedItemsQuantity.value || 1)),
        selectedItemsQuality.value
      )
    }

    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
    setSectionSuccess('catalog', `${selectedCatalogIds.value.length} element(s) ajoute(s).`)
    closeCatalogModal()
  } catch (error) {
    catalogError.value = error instanceof Error ? error.message : 'Ajout impossible.'
  } finally {
    addingCatalog.value = false
  }
}

async function confirmItemCreate(): Promise<void> {
  if (!character.value || !canEditQuickSection.value || creatingItem.value) {
    return
  }

  const trimmedName = newItemForm.value.name.trim()
  if (!trimmedName) {
    catalogError.value = 'Le nom de l\'équipement est obligatoire.'
    return
  }

  const normalizedEncumbrance = Math.max(0, Math.floor(newItemForm.value.encumbrance || 0))
  const normalizedQuantity = Math.max(1, Math.floor(newItemForm.value.quantity || 1))

  if (!(await confirmDestructiveAction('Creer puis ajouter cet equipement a la fiche ?'))) {
    return
  }

  creatingItem.value = true
  catalogError.value = null
  try {
    const createdItem = await createCatalogItem({
      name: trimmedName,
      description: newItemForm.value.description || null,
      encumbrance: normalizedEncumbrance,
    })

    await addCharacterItems(
      character.value.id,
      [createdItem.id],
      normalizedQuantity,
      newItemForm.value.quality
    )
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
    setSectionSuccess('catalog', 'Equipement cree et ajoute.')
    closeCatalogModal()
  } catch (error) {
    catalogError.value = error instanceof Error ? error.message : 'Création impossible.'
  } finally {
    creatingItem.value = false
  }
}

watch(careerQuery, async () => {
  await refreshCareerOptions()
})

watch(careerFilterMode, async () => {
  careerError.value = null
  selectedCareerId.value = null
  selectedCareerName.value = null
  await refreshCareerOptions()
})

watch(catalogQuery, async (value) => {
  scheduleCatalogSearch.cancel()

  if (catalogSection.value === 'items' && itemCatalogMode.value === 'create') {
    catalogOptions.value = []
    catalogSearchLoading.value = false
    return
  }

  const trimmed = value.trim()
  if (trimmed.length < 2) {
    catalogOptions.value = []
    catalogSearchLoading.value = false
    return
  }

  const requestId = ++catalogSearchSequence
  void scheduleCatalogSearch(trimmed, requestId, catalogSection.value)
})

async function saveQuickFields(options: { immediate?: boolean } = {}): Promise<void> {
  if (!canEditQuickSection.value) {
    return
  }

  if (editable.value.pvCurrent > editable.value.pvMax) {
    editable.value.pvCurrent = editable.value.pvMax
  }

  if (editable.value.fortuneCurrent > editable.value.fortuneMax) {
    editable.value.fortuneCurrent = editable.value.fortuneMax
  }

  if (editable.value.destinyCurrent > editable.value.destinyMax) {
    editable.value.destinyCurrent = editable.value.destinyMax
  }

  if (editable.value.xpAvailable > editable.value.xpTotal) {
    editable.value.xpAvailable = editable.value.xpTotal
  }

  // Apply money coercion before save with lock mechanism
  const coercedMoney = coerceMoney(
    editable.value.moneyGold,
    editable.value.moneySilver,
    editable.value.moneyCopper
  )
  editable.value.moneyGold = coercedMoney.gold
  editable.value.moneySilver = coercedMoney.silver
  editable.value.moneyCopper = coercedMoney.copper

  if (isEditableEqual(editable.value, lastSavedEditable.value)) {
    return
  }

  if (options.immediate) {
    await triggerSaveNow({ ...editable.value })
    return
  }

  triggerSave({ ...editable.value })
}

function formatCatalogOptionLabel(option: CatalogItem): string {
  if (catalogSection.value === 'skills' || catalogSection.value === 'talents') {
    return formatNamedWithSpecialization(option.name, option.specialization ?? null)
  }

  if (catalogSection.value === 'weapons') {
    const details: string[] = []
    if (typeof option.encumbrance === 'number') {
      details.push(`enc. ${option.encumbrance}`)
    }

    const meta = details.length > 0 ? ` (${details.join(', ')})` : ''
    const damage = option.damageFormula ? ` - ${option.damageFormula}` : ''
    return `${option.name}${meta}${damage}`
  }

  if (catalogSection.value === 'armors') {
    const details: string[] = []
    if (typeof option.encumbrance === 'number') {
      details.push(`enc. ${option.encumbrance}`)
    }

    const meta = details.length > 0 ? ` (${details.join(', ')})` : ''
    const armorPoints = typeof option.armorPoints === 'number' ? ` - PA ${option.armorPoints}` : ''
    return `${option.name}${meta}${armorPoints}`
  }

  if (catalogSection.value === 'items') {
    const details: string[] = []
    if (typeof option.encumbrance === 'number') {
      details.push(`enc. ${option.encumbrance}`)
    }

    return details.length > 0 ? `${option.name} (${details.join(', ')})` : option.name
  }

  return option.name
}

function setActionSuccess(message: string): void {
  actionSuccessMessage.value = message
  stopActionSuccessReset()
  startActionSuccessReset()
}

function setSectionSuccess(section: FeedbackSection, message: string): void {
  sectionSuccess.value = { section, message }
  stopSectionSuccessReset()
  startSectionSuccessReset()

  setActionSuccess(message)
}

function getSectionSuccessMessage(section: FeedbackSection): string | null {
  if (!sectionSuccess.value || sectionSuccess.value.section !== section) {
    return null
  }

  return sectionSuccess.value.message
}

async function confirmDestructiveAction(message: string): Promise<boolean> {
  return confirmAction(message)
}

function beginAction(key: string): boolean {
  if (actionBusyKey.value) {
    return false
  }

  actionBusyKey.value = key
  return true
}

function endAction(): void {
  actionBusyKey.value = null
}

async function runWithBusyAction(key: string, operation: () => Promise<void>): Promise<void> {
  if (!beginAction(key)) {
    return
  }

  try {
    await operation()
  } finally {
    endAction()
  }
}

watch(
  () => characterId.value,
  (value) => {
    if (!value) {
      unsubscribeRealtime()
      character.value = null
      errorMessage.value = 'Personnage invalide.'
      return
    }

    errorMessage.value = null
    void loadCharacter()
    subscribeRealtime(`character-detail-${value}`, [
      { table: 'characters', filter: `id=eq.${value}` },
      { table: 'character_stat_values', filter: `character_id=eq.${value}` },
      { table: 'character_skills', filter: `character_id=eq.${value}` },
      { table: 'character_talents', filter: `character_id=eq.${value}` },
      { table: 'character_weapons', filter: `character_id=eq.${value}` },
      { table: 'character_armors', filter: `character_id=eq.${value}` },
      { table: 'character_items', filter: `character_id=eq.${value}` },
    ])
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  scheduleDeferredRealtimeReload.cancel()
  scheduleDeferredLinksReload.cancel()
  scheduleCatalogSearch.cancel()
  stopSectionSuccessReset()
  stopActionSuccessReset()
})
</script>
