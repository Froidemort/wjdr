<template>
	<main class="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
		<div v-if="loading" class="skeleton h-56 w-full" />

		<div v-else-if="errorMessage" role="alert" class="alert alert-error alert-soft">
			<span>{{ errorMessage }}</span>
		</div>

		<template v-else-if="character">
			<AppCard :title="character.name">
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<span class="text-xl font-black capitalize leading-tight">{{ character.race }}</span>
						<component 
							:is="character.gender === 'masculin' ? Mars : Venus" 
							class="h-5 w-5 opacity-75"
						/>
					</div>
					<div class="flex flex-wrap items-center gap-2 text-sm opacity-90">
						<UserCog class="h-5 w-5" />
						<span class="text-xl">{{ character.careerName || 'Inconnue' }}</span>
						<button
							v-if="canEditQuickSection"
							class="btn btn-primary btn-xs"
							aria-label="Modifier la carrière"
							@click="openCareerModal"
						>
							<Pencil class="h-4 w-4" />
						</button>
						<span class="badge">PJ</span>
						<span v-if="!canEditQuickSection" class="badge badge-neutral">Lecture seule</span>
					</div>
				</div>

				<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<CharacterResourceCard
						label="Blessures"
						icon="heart"
						:current="editable.pvCurrent"
						:max="editable.pvMax"
						:editable="canEditQuickSection"
						@update:current="onQuickValueChange('pvCurrent', $event)"
						@update:max="onQuickValueChange('pvMax', $event)"
					/>
					<CharacterResourceCard
						label="Points de fortune"
						icon="clover"
						:current="editable.fortuneCurrent"
						:max="editable.fortuneMax"
						:editable="canEditQuickSection"
						@update:current="onQuickValueChange('fortuneCurrent', $event)"
						@update:max="onQuickValueChange('fortuneMax', $event)"
					/>
					<CharacterResourceCard
						label="Points de destin"
						icon="wand-sparkles"
						:current="editable.destinyCurrent"
						:max="editable.destinyCurrent"
						:editable="canEditQuickSection"
						@update:current="onQuickValueChange('destinyCurrent', $event)"
					/>
					<CharacterXpCard
						:current="editable.xpAvailable"
						:max="editable.xpTotal"
						:editable="canEditQuickSection"
						@update:current="onQuickValueChange('xpAvailable', $event)"
						@update:max="onQuickValueChange('xpTotal', $event)"
					/>
					<CharacterMoneyCard
						:gold="editable.moneyGold"
						:silver="editable.moneySilver"
						:copper="editable.moneyCopper"
					:editable="canEditQuickSection"
						@update:gold="onQuickValueChange('moneyGold', $event)"
						@update:silver="onQuickValueChange('moneySilver', $event)"
						@update:copper="onQuickValueChange('moneyCopper', $event)"
					/>
				</div>
			</AppCard>

			<div v-if="globalState !== 'ok'" class="toast toast-bottom toast-end z-50 p-2 sm:p-4">
				<div :class="['alert py-3 px-4 min-h-0 shadow-lg gap-2 border-0 text-white', globalState === 'error' ? 'bg-error' : 'bg-warning']" role="status" aria-live="polite">
					<LoaderCircle v-if="globalState === 'loading'" class="h-5 w-5 flex-shrink-0 animate-spin" />
					<CircleX v-else class="h-5 w-5 flex-shrink-0" />
					<span class="text-sm sm:text-base font-medium">{{ globalStateLabel }}</span>
				</div>
			</div>

			<div class="collapse collapse-arrow border border-base-300 bg-base-100">
				<input type="checkbox" :checked="true" />
				<div class="collapse-title text-lg font-semibold">Caractéristiques</div>
				<div class="collapse-content">
					<div v-if="visibleStats.length === 0" class="text-sm opacity-70">Aucune caractéristique disponible.</div>
					<div v-else class="mt-1 flex flex-wrap gap-3">
						<CharacteristicCard
							v-for="stat in visibleStats"
							:key="stat.statCode"
							:stat="stat"
							:editable="canEditQuickSection"
							@tick-up="onStatTick($event.statCode, $event.step)"
							@tick-down="onStatTick($event.statCode, -$event.step)"
							@update-base="onStatBaseChange($event.statCode, $event.baseValue)"
							@update-total-advanced="onStatTotalAdvancedChange($event.statCode, $event.totalAdvanced)"
						/>
					</div>
				</div>
			</div>

			<details class="collapse collapse-arrow border border-base-300 bg-base-100" open>
				<summary class="collapse-title">
					<div class="flex items-center justify-between gap-2">
						<h2 class="text-lg">Compétences</h2>
						<button v-if="canEditQuickSection" class="btn btn-sm" @click.stop.prevent="openCatalogModal('skills')">
							<Plus class="h-4 w-4" />
						</button>
					</div>
				</summary>
				<div class="collapse-content">
					<div v-if="characterSkills.length === 0" class="text-sm opacity-70">Aucune compétence.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="skill in characterSkills" :key="skill.skillId" class="card border border-base-300 bg-base-100">
							<div class="card-body p-3 gap-3">
								<div class="flex items-start justify-between gap-2">
									<div :class="skill.description ? 'tooltip tooltip-bottom' : ''" :data-tip="skill.description || ''">
										<h4 class="font-semibold">{{ formatNamedWithSpecialization(skill.name, skill.specialization) }}</h4>
									</div>
									<button v-if="canEditQuickSection" class="btn btn-ghost btn-xs" @click="onDeleteSkill(skill.skillId)">
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
								<div class="join" role="radiogroup" aria-label="Niveau de maîtrise">
									<button
										class="btn btn-sm join-item"
										:class="skill.masteryLevel === 1 ? 'btn-active' : ''"
										@click="onChangeSkillMastery(skill.skillId, 1)"
									>
										Acquis
									</button>
									<button
										class="btn btn-sm join-item"
										:class="skill.masteryLevel === 2 ? 'btn-active' : ''"
										@click="onChangeSkillMastery(skill.skillId, 2)"
									>
										+10%
									</button>
									<button
										class="btn btn-sm join-item"
										:class="skill.masteryLevel === 3 ? 'btn-active' : ''"
										@click="onChangeSkillMastery(skill.skillId, 3)"
									>
										+20%
									</button>
								</div>
							</div>
						</article>
					</div>
				</div>
			</details>

			<details class="collapse collapse-arrow border border-base-300 bg-base-100" open>
				<summary class="collapse-title">
					<div class="flex items-center justify-between gap-2">
						<h2 class="text-lg">Talents</h2>
						<button v-if="canEditQuickSection" class="btn btn-sm" @click.stop.prevent="openCatalogModal('talents')">
							<Plus class="h-4 w-4" />
						</button>
					</div>
				</summary>
				<div class="collapse-content">
					<div v-if="characterTalents.length === 0" class="text-sm opacity-70">Aucun talent.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="talent in characterTalents" :key="talent.talentId" class="card border border-base-300 bg-base-100">
							<div class="card-body p-3 gap-2">
								<div class="flex items-start justify-between gap-2">
									<div :class="talent.description ? 'tooltip tooltip-bottom' : ''" :data-tip="talent.description || ''">
										<h4 class="font-semibold">{{ formatNamedWithSpecialization(talent.name, talent.specialization) }}</h4>
									</div>
									<button v-if="canEditQuickSection" class="btn btn-ghost btn-xs" @click="onDeleteTalent(talent.talentId)">
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
							</div>
						</article>
					</div>
				</div>
			</details>

			<details class="collapse collapse-arrow border border-base-300 bg-base-100" open>
				<summary class="collapse-title">
					<div class="flex items-center justify-between gap-2">
						<h2 class="text-lg">Armes</h2>
						<button v-if="canEditQuickSection" class="btn btn-sm" @click.stop.prevent="openCatalogModal('weapons')">
							<Plus class="h-4 w-4" />
						</button>
					</div>
				</summary>
				<div class="collapse-content">
					<div v-if="characterWeapons.length === 0" class="text-sm opacity-70">Aucune arme.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="weapon in characterWeapons" :key="weapon.id" class="card border border-base-300 bg-base-100 hover:border-primary transition-colors">
							<div class="card-body p-3 gap-2">
								<div class="flex items-start justify-between gap-2">
									<h4 class="font-semibold">{{ weapon.name }}</h4>
									<button v-if="canEditQuickSection" class="btn btn-ghost btn-xs" @click="onDeleteWeapon(weapon.id)">
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
								<p v-if="weapon.description" class="text-sm opacity-70">{{ weapon.description }}</p>
								<div class="flex gap-1 flex-wrap">
									<span v-if="weapon.equipped === 'droite'" class="badge badge-sm badge-primary">Main droite</span>
									<span v-else-if="weapon.equipped === 'gauche'" class="badge badge-sm badge-primary">Main gauche</span>
									<span v-else-if="weapon.equipped === 'd&g'" class="badge badge-sm badge-primary">Deux mains</span>
									<span v-else class="badge badge-sm badge-outline">Inventaire</span>
								</div>
							</div>
						</article>
					</div>
				</div>
			</details>

			<details class="collapse collapse-arrow border border-base-300 bg-base-100" open>
				<summary class="collapse-title">
					<div class="flex items-center justify-between gap-2">
						<h2 class="text-lg">Armures</h2>
						<button v-if="canEditQuickSection" class="btn btn-sm" @click.stop.prevent="openCatalogModal('armors')">
							<Plus class="h-4 w-4" />
						</button>
					</div>
				</summary>
				<div class="collapse-content">
					<div v-if="characterArmors.length === 0" class="text-sm opacity-70">Aucune armure.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="armor in characterArmors" :key="armor.id" class="card border border-base-300 bg-base-100 hover:border-primary transition-colors">
							<div class="card-body p-3 gap-2">
								<div class="flex items-start justify-between gap-2">
									<h4 class="font-semibold">{{ armor.name }}</h4>
									<button v-if="canEditQuickSection" class="btn btn-ghost btn-xs" @click="onDeleteArmor(armor.id)">
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
								<p v-if="armor.description" class="text-sm opacity-70">{{ armor.description }}</p>
								<div class="flex gap-1 flex-wrap">
									<span v-if="armor.isEquipped" class="badge badge-sm badge-success">Équipée</span>
									<span v-else class="badge badge-sm badge-outline">Inventaire</span>
									<span v-if="armor.coveredLocations?.length">{{ armor.coveredLocations.join(', ') }}</span>
								</div>
							</div>
						</article>
					</div>
				</div>
			</details>
		</template>

		<dialog ref="careerDialogRef" class="modal modal-middle" @close="closeCareerModal">
			<div class="modal-box border border-base-300 p-6">
				<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeCareerModal">✕</button>
				<h3 class="mb-4 text-center text-xl font-semibold">Changer de carrière</h3>

				<div class="space-y-3">
					<SearchInput v-model="careerQuery" placeholder="Chercher une carrière" />

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
						<p v-else class="text-sm opacity-70 px-2 py-1">Aucune carrière trouvée.</p>
					</div>

					<p v-if="selectedCareerName" class="text-sm opacity-80">Sélection: {{ selectedCareerName }}</p>
					<div v-if="careerError" role="alert" class="alert alert-error alert-soft text-sm">
						<span>{{ careerError }}</span>
					</div>

					<div class="flex items-center justify-end gap-2">
						<button class="btn btn-sm" @click="closeCareerModal">Annuler</button>
						<button class="btn btn-sm" :class="changingCareer ? 'btn-disabled' : ''" @click="confirmCareerChange">
							<span v-if="changingCareer" class="loading loading-spinner loading-xs" aria-hidden="true" />
							Valider
						</button>
					</div>
				</div>
			</div>

			<form method="dialog" class="modal-backdrop">
				<button>Fermer</button>
			</form>
		</dialog>

		<dialog ref="catalogDialogRef" class="modal modal-middle" @close="closeCatalogModal">
			<div class="modal-box border border-base-300 p-6 max-w-2xl">
				<button class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" @click="closeCatalogModal">✕</button>
				<h3 class="mb-6 text-center text-2xl font-bold text-primary">Ajouter des {{ modalSectionLabel }}</h3>

				<div class="space-y-5">
					<!-- Search Input -->
					<div>
						<SearchInput 
							v-model="catalogQuery" 
							:placeholder="`Chercher des ${modalSectionLabel}`" 
							class="w-full" 
						/>
					</div>

					<!-- Catalog Options List -->
					<div class="rounded-lg border border-base-300 bg-base-100 overflow-hidden">
						<div class="max-h-80 overflow-y-auto">
							<ul v-if="catalogOptions.length > 0" class="menu menu-compact">
								<li v-for="option in catalogOptions" :key="option.id" class="hover:bg-base-200 transition-colors">
									<label class="label cursor-pointer justify-start gap-3 px-4 py-3 hover:bg-base-200 rounded-none">
										<input
											type="checkbox"
											class="checkbox checkbox-sm"
											:checked="selectedCatalogIds.includes(option.id)"
											@change="toggleCatalogSelection(option.id)"
										/>
										<div class="flex-1">
											<span class="font-medium">{{ formatCatalogOptionLabel(option) }}</span>
											<p v-if="option.specialization" class="text-xs opacity-60">{{ option.specialization }}</p>
										</div>
									</label>
								</li>
							</ul>
							<p v-else class="text-center text-sm opacity-70 py-8">Aucun élément trouvé.</p>
						</div>
					</div>

					<!-- Selection Summary -->
					<div v-if="selectedCatalogIds.length > 0" class="rounded-lg bg-primary bg-opacity-5 border border-primary border-opacity-20 p-4">
						<p class="text-sm font-semibold mb-3">{{ selectedCatalogIds.length }} sélectionné(s)</p>
						<div class="flex flex-wrap gap-2">
							<span
								v-for="selectedId in selectedCatalogIds"
								:key="selectedId"
								class="badge badge-primary badge-outline"
							>
								{{ selectedCatalogLabels[selectedId] || selectedId }}
							</span>
						</div>
					</div>

					<!-- Error Message -->
					<div v-if="catalogError" role="alert" class="alert alert-error alert-soft">
						<span>{{ catalogError }}</span>
					</div>

					<!-- Action Buttons -->
					<div class="flex items-center justify-end gap-3 pt-4 border-t border-base-300">
						<button class="btn btn-sm btn-ghost" @click="closeCatalogModal">Annuler</button>
						<button 
							class="btn btn-sm btn-primary" 
							:disabled="addingCatalog || selectedCatalogIds.length === 0"
							@click="confirmCatalogAdd"
						>
							<span v-if="addingCatalog" class="loading loading-spinner loading-xs" aria-hidden="true" />
							Ajouter ({{ selectedCatalogIds.length }})
						</button>
					</div>
				</div>
			</div>

			<form method="dialog" class="modal-backdrop">
				<button>Fermer</button>
			</form>
		</dialog>

		<!-- Pied de page navigation -->
		<footer class="flex flex-wrap gap-2 pt-2">
			<router-link v-if="character" class="btn btn-sm btn-ghost" :to="`/sessions/${character.sessionId}`">
				<ChevronLeft class="h-4 w-4" />
				Retour à la session
			</router-link>
			<router-link class="btn btn-sm btn-ghost" to="/">
				<ChevronLeft class="h-4 w-4" />
				Menu principal
			</router-link>
		</footer>
	</main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, CircleX, LoaderCircle, Mars, Pencil, Plus, Trash2, UserCog, Venus } from '@lucide/vue'
import AppCard from '../components/AppCard.vue'
import CharacterMoneyCard from '../components/CharacterMoneyCard.vue'
import CharacteristicCard from '../components/CharacteristicCard.vue'
import CharacterResourceCard from '../components/CharacterResourceCard.vue'
import CharacterXpCard from '../components/CharacterXpCard.vue'
import SearchInput from '../components/SearchInput.vue'
import { useLiveSave } from '../composables/useLiveSave'
import { useMoneyCoercion } from '../composables/useMoneyCoercion'
import { searchCatalog } from '../../repositories/catalogRepository'
import {
	addCharacterArmors,
	addCharacterSkills,
	addCharacterTalents,
	addCharacterWeapons,
	listCharacterArmors,
	listCharacterSkills,
	listCharacterTalents,
	listCharacterWeapons,
	removeCharacterArmor,
	removeCharacterSkill,
	removeCharacterTalent,
	removeCharacterWeapon,
	updateCharacterSkillMastery
} from '../../repositories/characterLinksRepository'
import { useAuthStore } from '../../stores/auth'
import { getCharacterById, updateCharacterCareer, updateCharacterCore, updateCharacterStatValues } from '../../repositories/charactersRepository'
import type {
	CatalogItem,
	CharacterArmor,
	CharacterDetail,
	CharacterSkill,
	CharacterTalent,
	CharacterWeapon
} from '../../types/domain'

type CatalogSection = 'skills' | 'talents' | 'weapons' | 'armors'

const CHARACTERISTICS_ORDER = ['CC', 'CT', 'F', 'E', 'AG', 'INT', 'FM', 'SOC', 'A', 'M', 'MAG'] as const
const CHARACTERISTICS_INDEX = new Map<string, number>(CHARACTERISTICS_ORDER.map((code, index) => [code, index]))
const CATALOG_LABELS: Record<CatalogSection, string> = {
	skills: 'compétences',
	talents: 'talents',
	weapons: 'armes',
	armors: 'armures'
}

const route = useRoute()
const authStore = useAuthStore()
const { coerceMoney } = useMoneyCoercion()
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const character = ref<CharacterDetail | null>(null)

const careerDialogRef = ref<HTMLDialogElement | null>(null)
const careerQuery = ref('')
const careerOptions = ref<CatalogItem[]>([])
const selectedCareerId = ref<string | null>(null)
const selectedCareerName = ref<string | null>(null)
const careerError = ref<string | null>(null)
const changingCareer = ref(false)

const catalogDialogRef = ref<HTMLDialogElement | null>(null)
const catalogSection = ref<CatalogSection>('skills')
const catalogQuery = ref('')
const catalogOptions = ref<CatalogItem[]>([])
const selectedCatalogIds = ref<string[]>([])
const selectedCatalogLabels = ref<Record<string, string>>({})
const catalogError = ref<string | null>(null)
const addingCatalog = ref(false)

const characterSkills = ref<CharacterSkill[]>([])
const characterTalents = ref<CharacterTalent[]>([])
const characterWeapons = ref<CharacterWeapon[]>([])
const characterArmors = ref<CharacterArmor[]>([])

const editable = ref({
	pvMax: 0,
	pvCurrent: 0,
	fortuneMax: 0,
	fortuneCurrent: 0,

	destinyCurrent: 0,
	xpTotal: 0,
	xpAvailable: 0,
	moneyGold: 0,
	moneySilver: 0,
	moneyCopper: 0
})

const canEditQuickSection = computed(() => Boolean(character.value && authStore.user?.id === character.value.userId))
const modalSectionLabel = computed(() => CATALOG_LABELS[catalogSection.value])

const visibleStats = computed(() => {
	if (!character.value) {
		return []
	}

	return character.value.stats.filter((stat) => {
		const normalized = stat.statCode.trim().toUpperCase()
		return normalized !== 'B' && normalized !== 'PD'
	}).sort((left, right) => {
		const leftCode = left.statCode.trim().toUpperCase()
		const rightCode = right.statCode.trim().toUpperCase()
		const leftIndex = CHARACTERISTICS_INDEX.get(leftCode)
		const rightIndex = CHARACTERISTICS_INDEX.get(rightCode)

		if (leftIndex === undefined && rightIndex === undefined) {
			return leftCode.localeCompare(rightCode)
		}
		if (leftIndex === undefined) {
			return 1
		}
		if (rightIndex === undefined) {
			return -1
		}

		return leftIndex - rightIndex
	})
})

const { status, triggerSave } = useLiveSave(async (payload: typeof editable.value) => {
	if (!character.value) {
		return
	}

	await updateCharacterCore(character.value.id, {
		pv_max: payload.pvMax,
		pv_current: payload.pvCurrent,
		fortune_max: payload.fortuneMax,
		fortune_current: payload.fortuneCurrent,
		destiny_current: payload.destinyCurrent,
		xp_total: payload.xpTotal,
		xp_available: Math.min(payload.xpAvailable, payload.xpTotal),
		money_gold: payload.moneyGold,
		money_silver: payload.moneySilver,
		money_copper: payload.moneyCopper
	})
}, 500)

const { status: statSaveStatus, triggerSave: triggerStatSave } = useLiveSave(async (payload: { statCode: string; currentAdvanced?: number; baseValue?: number; totalAdvanced?: number }) => {
	if (!character.value) {
		return
	}

	await updateCharacterStatValues(character.value.id, payload.statCode, {
		current_advanced: payload.currentAdvanced,
		base_value: payload.baseValue,
		total_advanced: payload.totalAdvanced
	})
}, 350)

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

async function loadCharacterLinks(characterId: string): Promise<void> {
	const [skills, talents, weapons, armors] = await Promise.all([
		listCharacterSkills(characterId),
		listCharacterTalents(characterId),
		listCharacterWeapons(characterId),
		listCharacterArmors(characterId)
	])

	characterSkills.value = skills
	characterTalents.value = talents
	characterWeapons.value = weapons
	characterArmors.value = armors
}

async function loadCharacter(): Promise<void> {
	const characterId = String(route.params.id ?? '')
	if (!characterId) {
		errorMessage.value = 'Personnage invalide.'
		return
	}

	loading.value = true
	errorMessage.value = null
	try {
		const data = await getCharacterById(characterId)
		character.value = data

		if (!data) {
			errorMessage.value = 'Personnage introuvable.'
			return
		}

		editable.value = {
			pvMax: data.pvMax,
			pvCurrent: data.pvCurrent,
			fortuneMax: data.fortuneMax,
			fortuneCurrent: data.fortuneCurrent,
			destinyCurrent: data.destinyCurrent,
			xpTotal: data.xpTotal,
			xpAvailable: data.xpAvailable,
			moneyGold: data.moneyGold,
			moneySilver: data.moneySilver,
			moneyCopper: data.moneyCopper
		}

		await loadCharacterLinks(data.id)
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Impossible de charger le personnage.'
	} finally {
		loading.value = false
	}
}

function onQuickValueChange(field: keyof typeof editable.value, value: number): void {
	const newValue = Math.max(0, value)
	
	// Constraint: current <= max for resource types
	if (field === 'pvCurrent' && editable.value.pvMax !== undefined) {
		editable.value[field] = Math.min(newValue, editable.value.pvMax) as never
	} else if (field === 'fortuneCurrent' && editable.value.fortuneMax !== undefined) {
		editable.value[field] = Math.min(newValue, editable.value.fortuneMax) as never
	} else {
		editable.value[field] = newValue as never
	}
	
	saveQuickFields()
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
	target.baseValue = nextBase
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
	target.totalAdvanced = nextTotalAdvanced
	triggerStatSave({ statCode, totalAdvanced: nextTotalAdvanced })
}

async function onChangeSkillMastery(skillId: string, level: 1 | 2 | 3): Promise<void> {
	if (!character.value || !canEditQuickSection.value) {
		return
	}

	try {
		await updateCharacterSkillMastery(character.value.id, skillId, level)
		const target = characterSkills.value.find((skill) => skill.skillId === skillId)
		if (target) {
			target.masteryLevel = level
		}
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Modification du niveau de maitrise impossible.'
	}
}

async function onDeleteSkill(skillId: string): Promise<void> {
	if (!character.value || !canEditQuickSection.value) {
		return
	}

	try {
		await removeCharacterSkill(character.value.id, skillId)
		await loadCharacterLinks(character.value.id)
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
	}
}

async function onDeleteTalent(talentId: string): Promise<void> {
	if (!character.value || !canEditQuickSection.value) {
		return
	}

	try {
		await removeCharacterTalent(character.value.id, talentId)
		await loadCharacterLinks(character.value.id)
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
	}
}

async function onDeleteWeapon(linkId: string): Promise<void> {
	if (!canEditQuickSection.value || !character.value) {
		return
	}

	try {
		await removeCharacterWeapon(linkId)
		await loadCharacterLinks(character.value.id)
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
	}
}

async function onDeleteArmor(linkId: string): Promise<void> {
	if (!canEditQuickSection.value || !character.value) {
		return
	}

	try {
		await removeCharacterArmor(linkId)
		await loadCharacterLinks(character.value.id)
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
	}
}

function openCareerModal(): void {
	careerError.value = null
	selectedCareerId.value = null
	selectedCareerName.value = null
	careerQuery.value = ''
	careerOptions.value = []
	if (!careerDialogRef.value) {
		return
	}

	careerDialogRef.value.showModal()
}

function closeCareerModal(): void {
	if (careerDialogRef.value?.open) {
		careerDialogRef.value.close()
	}
	selectedCareerId.value = null
	selectedCareerName.value = null
	careerError.value = null
}

function selectCareer(id: string, name: string): void {
	selectedCareerId.value = id
	selectedCareerName.value = name
	careerError.value = null
}

async function confirmCareerChange(): Promise<void> {
	if (!character.value || !canEditQuickSection.value || changingCareer.value) {
		return
	}

	if (!selectedCareerId.value) {
		careerError.value = 'Veuillez sélectionner une carrière.'
		return
	}

	changingCareer.value = true
	careerError.value = null
	try {
		await updateCharacterCareer(character.value.id, selectedCareerId.value)
		await loadCharacter()
		closeCareerModal()
	} catch (error) {
		careerError.value = error instanceof Error ? error.message : 'Modification de carrière impossible.'
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
	if (!catalogDialogRef.value) {
		return
	}

	catalogDialogRef.value.showModal()
}

function closeCatalogModal(): void {
	if (catalogDialogRef.value?.open) {
		catalogDialogRef.value.close()
	}
	selectedCatalogIds.value = []
	selectedCatalogLabels.value = {}
	catalogError.value = null
}

function toggleCatalogSelection(id: string): void {
	if (selectedCatalogIds.value.includes(id)) {
		selectedCatalogIds.value = selectedCatalogIds.value.filter((selectedId) => selectedId !== id)
		const nextLabels = { ...selectedCatalogLabels.value }
		delete nextLabels[id]
		selectedCatalogLabels.value = nextLabels
		return
	}

	const option = catalogOptions.value.find((candidate) => candidate.id === id)
	if (option) {
		selectedCatalogLabels.value = {
			...selectedCatalogLabels.value,
			[id]: formatCatalogOptionLabel(option)
		}
	}

	selectedCatalogIds.value = [...selectedCatalogIds.value, id]
}

async function confirmCatalogAdd(): Promise<void> {
	if (!character.value || !canEditQuickSection.value || addingCatalog.value) {
		return
	}

	if (selectedCatalogIds.value.length === 0) {
		catalogError.value = 'Veuillez sélectionner au moins un élément.'
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
		} else {
			await addCharacterArmors(character.value.id, selectedCatalogIds.value)
		}

		await loadCharacterLinks(character.value.id)
		closeCatalogModal()
	} catch (error) {
		catalogError.value = error instanceof Error ? error.message : 'Ajout impossible.'
	} finally {
		addingCatalog.value = false
	}
}

watch(careerQuery, async (value) => {
	const trimmed = value.trim()
	if (!trimmed) {
		careerOptions.value = []
		return
	}

	try {
		careerOptions.value = await searchCatalog('careers', trimmed)
	} catch {
		careerOptions.value = []
	}
})

watch(catalogQuery, async (value) => {
	const trimmed = value.trim()
	if (!trimmed) {
		catalogOptions.value = []
		return
	}

	try {
		catalogOptions.value = await searchCatalog(catalogSection.value, trimmed)
	} catch {
		catalogOptions.value = []
	}
})

function saveQuickFields(): void {
	if (!canEditQuickSection.value) {
		return
	}

	if (editable.value.pvCurrent > editable.value.pvMax) {
		editable.value.pvCurrent = editable.value.pvMax
	}

	if (editable.value.fortuneCurrent > editable.value.fortuneMax) {
		editable.value.fortuneCurrent = editable.value.fortuneMax
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

	triggerSave({ ...editable.value })
}

function formatNamedWithSpecialization(name: string, specialization: string | null): string {
	const trimmedSpecialization = specialization?.trim()
	if (!trimmedSpecialization) {
		return name
	}

	return `${name} (${trimmedSpecialization})`
}

function formatCatalogOptionLabel(option: CatalogItem): string {
	if (catalogSection.value === 'skills' || catalogSection.value === 'talents') {
		return formatNamedWithSpecialization(option.name, option.specialization ?? null)
	}

	return option.name
}

onMounted(loadCharacter)
</script>

<style scoped>
    .btn-active {
        background-color: var(--color-secondary-200);
        color: var(--color-accent-100);
    }
</style>