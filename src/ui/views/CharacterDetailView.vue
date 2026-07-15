<template>
	<main class="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
		<div v-if="loading && !character" class="skeleton h-56 w-full" />

		<div v-else-if="errorMessage && !character" role="alert" class="alert alert-error alert-soft">
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
						label="Vie"
						icon="heart"
						:current="editable.pvCurrent"
						:max="editable.pvMax"
						:editable="canEditQuickSection"
						@update:current="onQuickValueChange('pvCurrent', $event)"
						@update:max="onQuickValueChange('pvMax', $event)"
					/>
					<CharacterResourceCard
						label="Fortune"
						icon="clover"
						:current="editable.fortuneCurrent"
						:max="editable.fortuneMax"
						:editable="canEditQuickSection"
						@update:current="onQuickValueChange('fortuneCurrent', $event)"
						@update:max="onQuickValueChange('fortuneMax', $event)"
					/>
					<CharacterResourceCard
						label="Destin"
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
					<CharacterDerivedStatsCard
						:total-encumbrance="totalEncumbrance"
						:max-encumbrance="maxEncumbrance"
						:bonus-force="bonusForce"
						:bonus-endurance="bonusEndurance"
						:armor-by-location="armorByLocation"
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

			<details class="collapse collapse-arrow border border-base-300 bg-base-100" open>
				<summary class="collapse-title">
					<h2 class="text-lg">Caractéristiques</h2>
				</summary>
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
			</details>

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
					<div v-if="sortedCharacterSkills.length === 0" class="text-sm opacity-70">Aucune compétence.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="skill in sortedCharacterSkills" :key="skill.skillId" class="card border border-base-300 bg-base-100">
							<div class="card-body p-3 gap-3">
								<div class="flex items-start justify-between gap-2">
									<div class="flex items-start gap-2">
										<h4 class="font-semibold">{{ formatNamedWithSpecialization(skill.name, skill.specialization) }}</h4>
										<span class="badge badge-accent badge-sm self-start">{{ skill.statCode }}</span>
										<div
											v-if="!skill.isBasic"
											class="tooltip self-start"
											data-tip="Compétence avancée"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												shape-rendering="geometricPrecision"
												text-rendering="geometricPrecision"
												image-rendering="optimizeQuality"
												fill-rule="evenodd"
												clip-rule="evenodd"
												viewBox="0 0 512 512"
												class="h-5 w-5 fill-current text-accent"
											>
												<path fill-rule="nonzero" d="M255.998 0c70.69 0 134.694 28.657 181.017 74.981C483.342 121.308 512 185.309 512 255.998c0 70.69-28.655 134.694-74.985 181.017C390.692 483.345 326.688 512 255.998 512c-70.689 0-134.69-28.658-181.017-74.985C28.657 390.692 0 326.688 0 255.998c0-70.689 28.657-134.687 74.981-181.017C121.311 28.657 185.309 0 255.998 0zm-31.652 349.762h-63.307l48.606-187.522h92.713l48.606 187.522h-63.311l-6.898-29.703h-49.507l-6.902 29.703zm30.003-129.915l-12.301 52.507h27.603l-12.001-52.507h-3.301zm155.474-117.674C370.461 62.812 316.071 38.46 255.998 38.46c-60.072 0-114.46 24.352-153.825 63.713-39.361 39.365-63.713 93.753-63.713 153.825 0 60.073 24.352 114.463 63.713 153.825 39.365 39.365 93.753 63.716 153.825 63.716 60.073 0 114.463-24.351 153.825-63.716 39.365-39.362 63.716-93.752 63.716-153.825 0-60.072-24.351-114.46-63.716-153.825z" />
											</svg>
										</div>
									</div>
									<div class="flex items-center gap-1">
										<button
											v-if="skill.description"
											class="btn btn-ghost btn-xs"
											aria-label="Afficher la description de la compétence"
											@click="openDescriptionModal(formatNamedWithSpecialization(skill.name, skill.specialization), skill.description)"
										>
											<Info class="h-4 w-4" />
										</button>
										<button v-if="canEditQuickSection" class="btn btn-ghost btn-xs" @click="onDeleteSkill(skill.skillId)">
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
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
					<div v-if="sortedCharacterTalents.length === 0" class="text-sm opacity-70">Aucun talent.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="talent in sortedCharacterTalents" :key="talent.talentId" class="card border border-base-300 bg-base-100">
							<div class="card-body p-3 gap-2">
								<div class="flex items-start justify-between gap-2">
									<h4 class="font-semibold">{{ formatNamedWithSpecialization(talent.name, talent.specialization) }}</h4>
									<div class="flex items-center gap-1">
										<button
											v-if="talent.description"
											class="btn btn-ghost btn-xs"
											aria-label="Afficher la description du talent"
											@click="openDescriptionModal(formatNamedWithSpecialization(talent.name, talent.specialization), talent.description)"
										>
											<Info class="h-4 w-4" />
										</button>
										<button v-if="canEditQuickSection" class="btn btn-ghost btn-xs" @click="onDeleteTalent(talent.talentId)">
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
								</div>
							</div>
						</article>
					</div>
				</div>
			</details>

			<dialog ref="descriptionDialogRef" class="modal modal-middle" @close="closeDescriptionModal">
				<div class="modal-box border border-base-300 p-6 max-w-lg">
					<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeDescriptionModal">✕</button>
					<h3 class="text-lg font-semibold">{{ descriptionTitle || 'Description' }}</h3>
					<p class="mt-3 whitespace-pre-line text-sm opacity-90">{{ descriptionContent || 'Aucune description.' }}</p>
				</div>
				<form method="dialog" class="modal-backdrop">
					<button>Fermer</button>
				</form>
			</dialog>

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
					<div v-if="sortedCharacterWeapons.length === 0" class="text-sm opacity-70">Aucune arme.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="weapon in sortedCharacterWeapons" :key="weapon.id" class="card border border-base-300 bg-base-100 hover:border-primary transition-colors">
							<div class="card-body p-3 gap-2">
								<div class="flex items-start justify-between gap-2">
									<h4 class="font-semibold flex-1 min-w-0 break-words leading-tight">{{ weapon.name }}</h4>
									<div class="flex items-center gap-1">
										<StateCycleBadge
											v-if="canEditQuickSection"
											:value="weapon.equipped"
											:options="WEAPON_EQUIPPED_OPTIONS"
											@change="onWeaponStateChange(weapon, $event)"
										/>
										<button v-if="canEditQuickSection" class="btn btn-ghost btn-xs" @click="onDeleteWeapon(weapon.id)">
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
								</div>
								<p v-if="weapon.description" class="text-sm opacity-70">{{ weapon.description }}</p>
								<div class="flex gap-1 flex-wrap">
									<span class="badge badge-sm" :class="qualityBadgeClass(weapon.quality)">{{ weapon.quality || 'normal' }}</span>
									<span class="badge badge-sm badge-outline gap-1"><Weight class="h-3 w-3" /> {{ weapon.encumbrance }}</span>
									<span v-if="weapon.damageFormula" class="badge badge-sm badge-outline gap-1"><Sword class="h-3 w-3" /> {{ weapon.damageFormula }}</span>
									<StateCycleBadge
										v-if="!canEditQuickSection"
										:value="weapon.equipped"
										:options="WEAPON_EQUIPPED_OPTIONS"
										disabled
									/>
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
					<div v-if="sortedCharacterArmors.length === 0" class="text-sm opacity-70">Aucune armure.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="armor in sortedCharacterArmors" :key="armor.id" class="card border border-base-300 bg-base-100 hover:border-primary transition-colors">
							<div class="card-body p-3 gap-2">
								<div class="flex items-start justify-between gap-2">
									<h4 class="font-semibold flex-1 min-w-0 break-words leading-tight">{{ armor.name }}</h4>
									<div class="flex items-center gap-1">
										<StateCycleBadge
											v-if="canEditQuickSection"
											:value="armor.isEquipped"
											:options="ARMOR_EQUIPPED_OPTIONS"
											@change="onArmorStateChange(armor, $event)"
										/>
										<button v-if="canEditQuickSection" class="btn btn-ghost btn-xs" @click="onDeleteArmor(armor.id)">
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
								</div>
								<p v-if="armor.description" class="text-sm opacity-70">{{ armor.description }}</p>
								<div class="flex gap-1 flex-wrap">
									<span class="badge badge-sm" :class="qualityBadgeClass(armor.quality)">{{ armor.quality || 'normal' }}</span>
									<span class="badge badge-sm badge-outline gap-1"><Weight class="h-3 w-3" /> {{ armor.encumbrance }}</span>
									<span class="badge badge-sm badge-outline gap-1"><Shield class="h-3 w-3" /> {{ armor.armorPoints }}</span>
									<StateCycleBadge
										v-if="!canEditQuickSection"
										:value="armor.isEquipped"
										:options="ARMOR_EQUIPPED_OPTIONS"
										disabled
									/>
									<span v-if="armor.coveredLocations?.length" class="w-full text-xs opacity-75 break-words">{{ armor.coveredLocations.join(', ') }}</span>
								</div>
							</div>
						</article>
					</div>
				</div>
			</details>

			<details class="collapse collapse-arrow border border-base-300 bg-base-100" open>
				<summary class="collapse-title">
					<div class="flex items-center justify-between gap-2">
						<h2 class="text-lg">Équipements</h2>
						<button v-if="canEditQuickSection" class="btn btn-sm" @click.stop.prevent="openCatalogModal('items')">
							<Plus class="h-4 w-4" />
						</button>
					</div>
				</summary>
				<div class="collapse-content">
					<div v-if="sortedCharacterItems.length === 0" class="text-sm opacity-70">Aucun équipement.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="item in sortedCharacterItems" :key="item.id" class="card border border-base-300 bg-base-100 hover:border-primary transition-colors">
							<div class="card-body p-3 gap-2">
								<div class="flex items-start justify-between gap-2">
									<h4 class="font-semibold flex-1 min-w-0 break-words leading-tight">{{ item.name }}</h4>
									<button v-if="canEditQuickSection" class="btn btn-ghost btn-xs" @click="onDeleteItem(item.id)">
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
								<p v-if="item.description" class="text-sm opacity-70">{{ item.description }}</p>
								<div class="flex gap-1 flex-wrap">
									<span class="badge badge-sm" :class="qualityBadgeClass(item.quality)">{{ item.quality || 'normal' }}</span>
									<span class="badge badge-sm badge-outline gap-1"><Weight class="h-3 w-3" /> {{ item.encumbrance }}</span>
									<span class="badge badge-sm badge-neutral">x{{ item.quantity }}</span>
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
						<button class="btn btn-sm btn-accent" :disabled="changingCareer" @click="confirmCareerChange">
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
								<li
									v-for="option in catalogOptions"
									:key="option.id"
									:class="[
										'transition-colors border-l-4',
										selectedCatalogIds.includes(option.id)
											? 'bg-base-200 border-l-neutral'
											: 'border-l-transparent hover:bg-base-200'
									]"
								>
									<label class="label cursor-pointer justify-start gap-3 px-4 py-3 rounded-none">
										<input
											type="checkbox"
											class="checkbox checkbox-sm"
											:checked="selectedCatalogIds.includes(option.id)"
											@change="toggleCatalogSelection(option.id)"
										/>
										<div class="flex-1 min-w-0">
											<div class="flex flex-wrap items-center gap-2 min-w-0">
												<span class="font-medium break-words leading-tight">{{ formatCatalogOptionLabel(option) }}</span>
												<span
													v-if="selectedCatalogIds.includes(option.id)"
													class="badge badge-neutral badge-sm"
												>
													Sélectionné
												</span>
											</div>
											<p v-if="option.specialization" class="text-xs opacity-60">{{ option.specialization }}</p>
										</div>
									</label>
								</li>
							</ul>
							<p v-else class="text-center text-sm opacity-70 py-8">Aucun élément trouvé.</p>
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
								class="btn btn-xs btn-outline btn-neutral h-auto min-h-0 max-w-full justify-start gap-2 px-3 py-2 normal-case whitespace-normal text-left"
								:aria-label="`Retirer ${selectedCatalogLabels[selectedId] || selectedId} de la sélection`"
								@click="removeCatalogSelection(selectedId)"
							>
								<span class="break-words">{{ selectedCatalogLabels[selectedId] || selectedId }}</span>
								<span aria-hidden="true" class="text-xs opacity-70">✕</span>
							</button>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, CircleX, Info, LoaderCircle, Mars, Pencil, Plus, Shield, Sword, Trash2, UserCog, Venus, Weight } from '@lucide/vue'
import AppCard from '../components/AppCard.vue'
import CharacterDerivedStatsCard from '../components/CharacterDerivedStatsCard.vue'
import CharacterMoneyCard from '../components/CharacterMoneyCard.vue'
import CharacteristicCard from '../components/CharacteristicCard.vue'
import CharacterResourceCard from '../components/CharacterResourceCard.vue'
import StateCycleBadge from '../components/StateCycleBadge.vue'
import CharacterXpCard from '../components/CharacterXpCard.vue'
import SearchInput from '../components/SearchInput.vue'
import { useLiveSave } from '../composables/useLiveSave'
import { useMoneyCoercion } from '../composables/useMoneyCoercion'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'
import { searchCatalog } from '../../repositories/catalogRepository'
import {
	addCharacterItems,
	addCharacterArmors,
	addCharacterSkills,
	addCharacterTalents,
	addCharacterWeapons,
	listCharacterItems,
	listCharacterArmors,
	listCharacterSkills,
	listCharacterTalents,
	listCharacterWeapons,
	updateCharacterArmorEquipped,
	updateCharacterWeaponEquipped,
	removeCharacterItem,
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
	CharacterItem,
	CharacterSkill,
	CharacterTalent,
	CharacterWeapon
} from '../../types/domain'

type CatalogSection = 'skills' | 'talents' | 'weapons' | 'armors' | 'items'

const CHARACTERISTICS_ORDER = ['CC', 'CT', 'F', 'E', 'AG', 'INT', 'FM', 'SOC', 'A', 'M', 'MAG'] as const
const CHARACTERISTICS_INDEX = new Map<string, number>(CHARACTERISTICS_ORDER.map((code, index) => [code, index]))
const CATALOG_LABELS: Record<CatalogSection, string> = {
	skills: 'compétences',
	talents: 'talents',
	weapons: 'armes',
	armors: 'armures',
	items: 'équipements'
}

const WEAPON_EQUIPPED_OPTIONS = [
	{ value: null, label: 'Inventaire', badgeClass: 'badge-outline' },
	{ value: 'droite', label: 'Droite', badgeClass: 'badge-primary' },
	{ value: 'gauche', label: 'Gauche', badgeClass: 'badge-primary' },
	{ value: 'd&g', label: 'Deux mains', badgeClass: 'badge-primary' }
] as const

const ARMOR_EQUIPPED_OPTIONS = [
	{ value: false, label: 'Inventaire', badgeClass: 'badge-outline' },
	{ value: true, label: 'Équipée', badgeClass: 'badge-success' }
] as const

const route = useRoute()
const authStore = useAuthStore()
const { coerceMoney } = useMoneyCoercion()
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const character = ref<CharacterDetail | null>(null)
const characterId = computed(() => String(route.params.id ?? ''))
let deferredRealtimeReloadTimer: ReturnType<typeof setTimeout> | null = null
let backgroundRefreshInterval: ReturnType<typeof setInterval> | null = null

const careerDialogRef = ref<HTMLDialogElement | null>(null)
const careerQuery = ref('')
const careerOptions = ref<CatalogItem[]>([])
const selectedCareerId = ref<string | null>(null)
const selectedCareerName = ref<string | null>(null)
const careerError = ref<string | null>(null)
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
const descriptionTitle = ref<string | null>(null)
const descriptionContent = ref<string | null>(null)

const characterSkills = ref<CharacterSkill[]>([])
const characterTalents = ref<CharacterTalent[]>([])
const characterWeapons = ref<CharacterWeapon[]>([])
const characterArmors = ref<CharacterArmor[]>([])
const characterItems = ref<CharacterItem[]>([])

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

function sortByName<T extends { name: string }>(entries: T[]): T[] {
	return [...entries].sort((left, right) => left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }))
}

const sortedCharacterSkills = computed(() => sortByName(characterSkills.value))
const sortedCharacterTalents = computed(() => sortByName(characterTalents.value))
const sortedCharacterWeapons = computed(() => sortByName(characterWeapons.value))
const sortedCharacterArmors = computed(() => sortByName(characterArmors.value))
const sortedCharacterItems = computed(() => sortByName(characterItems.value))

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

const forceValue = computed(() => {
	if (!character.value) {
		return 0
	}

	const forceStat = character.value.stats.find((stat) => stat.statCode.trim().toUpperCase() === 'F')
	if (!forceStat) {
		return 0
	}

	return Math.max(0, forceStat.baseValue + forceStat.currentAdvanced)
})

const enduranceValue = computed(() => {
	if (!character.value) {
		return 0
	}

	const enduranceStat = character.value.stats.find((stat) => stat.statCode.trim().toUpperCase() === 'E')
	if (!enduranceStat) {
		return 0
	}

	return Math.max(0, enduranceStat.baseValue + enduranceStat.currentAdvanced)
})

const bonusForce = computed(() => Math.floor(forceValue.value / 10))
const bonusEndurance = computed(() => Math.floor(enduranceValue.value / 10))

const maxEncumbrance = computed(() => {
	if (!character.value) {
		return 0
	}

	const multiplier = character.value.race.trim().toLowerCase() === 'nain' ? 30 : 20
	return forceValue.value * multiplier
})

const totalEncumbrance = computed(() => {
	const weaponsEncumbrance = characterWeapons.value.reduce((total, weapon) => total + (weapon.encumbrance ?? 0), 0)
	const armorsEncumbrance = characterArmors.value.reduce((total, armor) => total + (armor.encumbrance ?? 0), 0)
	const itemsEncumbrance = characterItems.value.reduce((total, item) => total + ((item.encumbrance ?? 0) * Math.max(1, item.quantity)), 0)

	return weaponsEncumbrance + armorsEncumbrance + itemsEncumbrance
})

const armorByLocation = computed(() => {
	const totals = {
		tete: 0,
		corps: 0,
		bras: 0,
		jambes: 0
	}

	for (const armor of characterArmors.value) {
		if (!armor.isEquipped || !armor.coveredLocations?.length) {
			continue
		}

		for (const location of armor.coveredLocations) {
			const normalized = location.trim().toLowerCase()
			if (normalized === 'tête' || normalized === 'tete') {
				totals.tete += armor.armorPoints
			}
			if (normalized === 'corps') {
				totals.corps += armor.armorPoints
			}
			if (normalized === 'bras') {
				totals.bras += armor.armorPoints
			}
			if (normalized === 'jambes') {
				totals.jambes += armor.armorPoints
			}
		}
	}

	return totals
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

function requestExternalCharacterRefresh(): void {
	if (status.value === 'pending' || status.value === 'saving' || statSaveStatus.value === 'pending' || statSaveStatus.value === 'saving') {
		if (deferredRealtimeReloadTimer) {
			clearTimeout(deferredRealtimeReloadTimer)
		}

		deferredRealtimeReloadTimer = setTimeout(() => {
			void loadCharacter({ background: true })
		}, 700)
		return
	}

	void loadCharacter({ background: true })
}

const { subscribe: subscribeRealtime, unsubscribe: unsubscribeRealtime } = useRealtimeChannels(() => {
	requestExternalCharacterRefresh()
}, { debounceMs: 450 })

async function loadCharacterLinks(characterId: string): Promise<void> {
	const [skills, talents, weapons, armors, items] = await Promise.all([
		listCharacterSkills(characterId),
		listCharacterTalents(characterId),
		listCharacterWeapons(characterId),
		listCharacterArmors(characterId),
		listCharacterItems(characterId)
	])

	characterSkills.value = skills
	characterTalents.value = talents
	characterWeapons.value = weapons
	characterArmors.value = armors
	characterItems.value = items
}

async function loadCharacter(options: { background?: boolean } = {}): Promise<void> {
	const characterId = String(route.params.id ?? '')
	if (!characterId) {
		errorMessage.value = 'Personnage invalide.'
		return
	}

	const isBackgroundRefresh = Boolean(options.background && character.value)
	if (!isBackgroundRefresh) {
		loading.value = true
		errorMessage.value = null
	}
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
		if (!isBackgroundRefresh || !character.value) {
			errorMessage.value = error instanceof Error ? error.message : 'Impossible de charger le personnage.'
		}
	} finally {
		if (!isBackgroundRefresh) {
			loading.value = false
		}
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

function canEquipWeaponCheck(_weapon: CharacterWeapon, _targetEquipped: 'droite' | 'gauche' | 'd&g' | null): boolean {
	// Placeholder for future weapon rules validation.
	return true
}

async function onWeaponStateChange(weapon: CharacterWeapon, value: string | boolean | null): Promise<void> {
	if (!canEditQuickSection.value || !character.value) {
		return
	}

	if (value !== null && value !== 'droite' && value !== 'gauche' && value !== 'd&g') {
		return
	}

	const nextEquipped: 'droite' | 'gauche' | 'd&g' | null = value
	if (!canEquipWeaponCheck(weapon, nextEquipped)) {
		return
	}

	try {
		await updateCharacterWeaponEquipped(weapon.id, nextEquipped)
		weapon.equipped = nextEquipped
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
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

function canEquipArmorCheck(_armor: CharacterArmor, _targetEquipped: boolean): boolean {
	// Placeholder for future armor rules validation.
	return true
}

async function onArmorStateChange(armor: CharacterArmor, value: string | boolean | null): Promise<void> {
	if (!canEditQuickSection.value || !character.value) {
		return
	}

	if (typeof value !== 'boolean') {
		return
	}

	const nextEquipped = value
	if (!canEquipArmorCheck(armor, nextEquipped)) {
		return
	}

	try {
		await updateCharacterArmorEquipped(armor.id, nextEquipped)
		armor.isEquipped = nextEquipped
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
	}
}

async function onDeleteItem(linkId: string): Promise<void> {
	if (!canEditQuickSection.value || !character.value) {
		return
	}

	try {
		await removeCharacterItem(linkId)
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

function openDescriptionModal(title: string, description: string | null): void {
	descriptionTitle.value = title
	descriptionContent.value = description?.trim() ?? null
	descriptionDialogRef.value?.showModal()
}

function closeDescriptionModal(): void {
	if (descriptionDialogRef.value?.open) {
		descriptionDialogRef.value.close()
	}
	descriptionTitle.value = null
	descriptionContent.value = null
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
		removeCatalogSelection(id)
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

	addingCatalog.value = true
	catalogError.value = null
	try {
		if (catalogSection.value === 'skills') {
			await addCharacterSkills(character.value.id, selectedCatalogIds.value)
		} else if (catalogSection.value === 'talents') {
			await addCharacterTalents(character.value.id, selectedCatalogIds.value)
		} else if (catalogSection.value === 'weapons') {
			await addCharacterWeapons(character.value.id, selectedCatalogIds.value)
		} else if (catalogSection.value === 'items') {
			await addCharacterItems(character.value.id, selectedCatalogIds.value)
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

	if (catalogSection.value === 'weapons') {
		const details: string[] = []
		if (option.quality) {
			details.push(option.quality)
		}
		if (typeof option.encumbrance === 'number') {
			details.push(`enc. ${option.encumbrance}`)
		}

		const meta = details.length > 0 ? ` (${details.join(', ')})` : ''
		const damage = option.damageFormula ? ` - ${option.damageFormula}` : ''
		return `${option.name}${meta}${damage}`
	}

	if (catalogSection.value === 'armors') {
		const details: string[] = []
		if (option.quality) {
			details.push(option.quality)
		}
		if (typeof option.encumbrance === 'number') {
			details.push(`enc. ${option.encumbrance}`)
		}

		const meta = details.length > 0 ? ` (${details.join(', ')})` : ''
		const armorPoints = typeof option.armorPoints === 'number' ? ` - PA ${option.armorPoints}` : ''
		return `${option.name}${meta}${armorPoints}`
	}

	if (catalogSection.value === 'items') {
		const details: string[] = []
		if (option.quality) {
			details.push(option.quality)
		}
		if (typeof option.encumbrance === 'number') {
			details.push(`enc. ${option.encumbrance}`)
		}

		return details.length > 0 ? `${option.name} (${details.join(', ')})` : option.name
	}

	return option.name
}

function qualityBadgeClass(quality: string | null): string {
	const normalized = quality?.trim().toLowerCase() ?? ''
	if (normalized === 'médiocre') {
		return 'badge-error'
	}
	if (normalized === 'bonne') {
		return 'badge-info'
	}
	if (normalized === 'exceptionelle') {
		return 'badge-secondary'
	}
	return 'badge-ghost'
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
			{ table: 'character_items', filter: `character_id=eq.${value}` }
		])
	},
	{ immediate: true }
)

onMounted(() => {
	backgroundRefreshInterval = setInterval(() => {
		if (!character.value || document.visibilityState !== 'visible') {
			return
		}

		requestExternalCharacterRefresh()
	}, 2000)
})

onBeforeUnmount(() => {
	if (deferredRealtimeReloadTimer) {
		clearTimeout(deferredRealtimeReloadTimer)
		deferredRealtimeReloadTimer = null
	}

	if (backgroundRefreshInterval) {
		clearInterval(backgroundRefreshInterval)
		backgroundRefreshInterval = null
	}
})
</script>

<style scoped>
	.btn-active {
		background-color: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-accent-content);
	}
</style>