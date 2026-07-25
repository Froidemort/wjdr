<template>
  <main class="mx-auto max-w-6xl p-4 pb-24 sm:p-6 sm:pb-6 space-y-4">
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
              class="btn btn-sm btn-square min-h-11 min-w-11"
							aria-label="Modifier la carrière"
							@click="openCareerModal"
						>
							<Pencil class="h-4 w-4" />
						</button>
						<span class="badge">PJ</span>
						<span v-if="!canEditQuickSection" class="badge badge-neutral">Lecture seule</span>
					</div>
				</div>

          <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            <CharacterValueCard
              label="Vie"
              :icon="Heart"
              icon-class="h-6 w-6 text-error"
              :current="editable.pvCurrent"
              :max="editable.pvMax"
              :editable="canEditQuickSection"
              current-aria-label="Valeur courante de vie"
              max-aria-label="Valeur maximale de vie"
              @update:current="onQuickValueChange('pvCurrent', $event)"
              @update:max="onQuickValueChange('pvMax', $event)"
            />
            <CharacterValueCard
              label="Fortune"
              :icon="Clover"
              icon-class="h-6 w-6 text-success"
              :current="editable.fortuneCurrent"
              :max="editable.fortuneMax"
              :editable="canEditQuickSection"
              current-aria-label="Valeur courante de fortune"
              max-aria-label="Valeur maximale de fortune"
              @update:current="onQuickValueChange('fortuneCurrent', $event)"
              @update:max="onQuickValueChange('fortuneMax', $event)"
            />
            <CharacterValueCard
              label="Destin"
              :icon="WandSparkles"
              icon-class="h-6 w-6 text-accent"
              :current="editable.destinyCurrent"
              :max="editable.destinyCurrent"
              :editable="canEditQuickSection"
              current-aria-label="Valeur courante de destin"
              max-aria-label="Valeur maximale de destin"
              @update:current="onQuickValueChange('destinyCurrent', $event)"
            />
            <CharacterValueCard
              label="Experience"
              :icon="ScrollText"
              icon-class="h-6 w-6 text-base-content/80"
              :current="editable.xpAvailable"
              :max="editable.xpTotal"
              :editable="canEditQuickSection"
              current-aria-label="Experience disponible"
              max-aria-label="Experience maximale"
              @update:current="onQuickValueChange('xpAvailable', $event)"
              @update:max="onQuickValueChange('xpTotal', $event)"
            />
            <CharacterValueCard
              label="Points de folie"
              :icon="Hospital"
              icon-class="h-6 w-6 text-warning"
              :current="editable.insanityPoints"
              :editable="canEditQuickSection"
              current-aria-label="Points de folie"
              @update:current="onQuickValueChange('insanityPoints', $event)"
            />
					<CharacterMoneyCard
						:gold="editable.moneyGold"
						:silver="editable.moneySilver"
						:copper="editable.moneyCopper"
					:editable="canEditQuickSection"
						@update:gold="onQuickValueChange('moneyGold', $event)"
						@update:silver="onQuickValueChange('moneySilver', $event)"
						@update:copper="onQuickValueChange('moneyCopper', $event)"
						@commit="onMoneyCommit"
						@subtract="onMoneySubtract"
					/>
          <div class="sm:col-span-2 lg:col-span-1">
            <CharacterDerivedStatsCard
						:total-encumbrance="totalEncumbrance"
						:max-encumbrance="maxEncumbrance"
						:bonus-force="bonusForce"
						:bonus-endurance="bonusEndurance"
						:armor-by-location="armorByLocation"
            />
          </div>
				</div>
			</AppCard>

			<div v-if="globalState !== 'ok'" class="toast toast-bottom toast-end z-50 p-2 sm:p-4">
				<div :class="['alert py-3 px-4 min-h-0 shadow-lg gap-2 border-0', globalState === 'error' ? 'bg-error text-error-content' : 'bg-warning text-warning-content']" role="status" aria-live="polite">
					<LoaderCircle v-if="globalState === 'loading'" class="h-5 w-5 flex-shrink-0 animate-spin" />
					<CircleX v-else class="h-5 w-5 flex-shrink-0" />
					<span class="text-sm sm:text-base font-medium">{{ globalStateLabel }}</span>
				</div>
			</div>

			<details class="collapse collapse-arrow border border-base-300 bg-base-100">
				<summary class="collapse-title">
					<h2 class="text-lg">Caractéristiques</h2>
				</summary>
				<div class="collapse-content">
          <div class="mb-3 flex flex-wrap items-center justify-start gap-3 border-b border-base-300 pb-3">
						<StateCycleBadge
							:value="characteristicsViewMode"
							:options="CHARACTERISTICS_VIEW_OPTIONS"
							@change="onCharacteristicsViewModeChange"
						/>
						<button
							v-if="canEditQuickSection"
							type="button"
              class="btn btn-square min-h-11 min-w-11"
							aria-label="Importer les caractéristiques de carrière"
							@click.stop.prevent="openStatsImportModal"
						>
							<Import class="h-4 w-4" />
						</button>
					</div>
					<div v-if="visibleStats.length === 0" class="text-sm opacity-70">Aucune caractéristique disponible.</div>
					<div v-else-if="characteristicsViewMode === 'normal'" class="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
					<div v-else class="mt-1 space-y-2 overflow-x-hidden">
						<div class="grid grid-cols-2 gap-2 md:grid-cols-4">
							<div v-for="stat in primaryStatsRows[0]" :key="`compact-${stat.statCode}`" class="rounded-box border border-base-300 bg-base-200 px-2 py-1 text-center">
								<div class="text-xs font-semibold uppercase opacity-75">{{ stat.statCode }}</div>
								<div class="text-lg font-black tabular-nums">{{ stat.baseValue + stat.currentAdvanced }}</div>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-2 md:grid-cols-4">
							<div v-for="stat in primaryStatsRows[1]" :key="`compact-${stat.statCode}`" class="rounded-box border border-base-300 bg-base-200 px-2 py-1 text-center">
								<div class="text-xs font-semibold uppercase opacity-75">{{ stat.statCode }}</div>
								<div class="text-lg font-black tabular-nums">{{ stat.baseValue + stat.currentAdvanced }}</div>
							</div>
						</div>
						<div class="grid grid-cols-3 gap-2">
							<div v-for="stat in secondaryStats" :key="`compact-${stat.statCode}`" class="rounded-box border border-base-300 bg-base-100 px-2 py-1 text-center">
								<div class="text-xs font-semibold uppercase opacity-75">{{ stat.statCode }}</div>
								<div class="text-lg font-black tabular-nums">{{ stat.baseValue + stat.currentAdvanced }}</div>
							</div>
						</div>
					</div>
				</div>
			</details>

			<details class="collapse collapse-arrow border border-base-300 bg-base-100">
				<summary class="collapse-title">
          <h2 class="text-lg">Compétences</h2>
				</summary>
				<div class="collapse-content">
          <div v-if="canEditQuickSection" class="mb-3 flex justify-start">
            <button class="btn btn-sm btn-square min-h-11 min-w-11" aria-label="Ajouter des compétences" @click.stop.prevent="openCatalogModal('skills')">
              <Plus class="h-4 w-4" />
            </button>
          </div>
					<div v-if="sortedCharacterSkills.length === 0" class="text-sm opacity-70">Aucune compétence.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <article v-for="skill in sortedCharacterSkills" :key="skill.skillId" v-memo="[skill.masteryLevel, canEditQuickSection]" class="group card border border-base-300 bg-base-100">
							<div class="card-body p-3 gap-3">
								<div class="flex items-start justify-between gap-2">
									<div class="flex items-start gap-2">
                    <h4 class="font-semibold">{{ formatNamedWithSpecialization(skill.name, skill.specialization) }}</h4>
                    <span class="badge badge-neutral badge-sm self-start">{{ skill.statCode }}</span>
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
												class="h-5 w-5 fill-current text-warning"
											>
												<path fill-rule="nonzero" d="M255.998 0c70.69 0 134.694 28.657 181.017 74.981C483.342 121.308 512 185.309 512 255.998c0 70.69-28.655 134.694-74.985 181.017C390.692 483.345 326.688 512 255.998 512c-70.689 0-134.69-28.658-181.017-74.985C28.657 390.692 0 326.688 0 255.998c0-70.689 28.657-134.687 74.981-181.017C121.311 28.657 185.309 0 255.998 0zm-31.652 349.762h-63.307l48.606-187.522h92.713l48.606 187.522h-63.311l-6.898-29.703h-49.507l-6.902 29.703zm30.003-129.915l-12.301 52.507h27.603l-12.001-52.507h-3.301zm155.474-117.674C370.461 62.812 316.071 38.46 255.998 38.46c-60.072 0-114.46 24.352-153.825 63.713-39.361 39.365-63.713 93.753-63.713 153.825 0 60.073 24.352 114.463 63.713 153.825 39.365 39.365 93.753 63.716 153.825 63.716 60.073 0 114.463-24.351 153.825-63.716 39.365-39.362 63.716-93.752 63.716-153.825 0-60.072-24.351-114.46-63.716-153.825z" />
											</svg>
										</div>
									</div>
                  <div class="hover-actions flex items-center gap-1">
										<button
											v-if="skill.description"
                      class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11"
											aria-label="Afficher la description de la compétence"
											@click="openDescriptionModal(formatNamedWithSpecialization(skill.name, skill.specialization), skill.description)"
										>
											<Info class="h-4 w-4" />
										</button>
                    <button v-if="canEditQuickSection" class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11" @click="onDeleteSkill(skill.skillId)">
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
								</div>
								<div class="join" role="radiogroup" aria-label="Niveau de maîtrise">
									<button
                    class="btn btn-sm h-11 min-h-11 join-item"
										:class="skill.masteryLevel === 1 ? 'btn-active' : ''"
										@click="onChangeSkillMastery(skill.skillId, 1)"
									>
										Acquis
									</button>
									<button
                    class="btn btn-sm h-11 min-h-11 join-item"
										:class="skill.masteryLevel === 2 ? 'btn-active' : ''"
										@click="onChangeSkillMastery(skill.skillId, 2)"
									>
										+10%
									</button>
									<button
                    class="btn btn-sm h-11 min-h-11 join-item"
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

			<details class="collapse collapse-arrow border border-base-300 bg-base-100">
				<summary class="collapse-title">
          <h2 class="text-lg">Talents</h2>
				</summary>
				<div class="collapse-content">
          <div v-if="canEditQuickSection" class="mb-3 flex justify-start">
            <button class="btn btn-sm btn-square min-h-11 min-w-11" aria-label="Ajouter des talents" @click.stop.prevent="openCatalogModal('talents')">
              <Plus class="h-4 w-4" />
            </button>
          </div>
					<div v-if="sortedCharacterTalents.length === 0" class="text-sm opacity-70">Aucun talent.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <article v-for="talent in sortedCharacterTalents" :key="talent.talentId" v-memo="[talent.talentId, canEditQuickSection]" class="group card border border-base-300 bg-base-100">
							<div class="card-body p-3 gap-2">
								<div class="flex items-start justify-between gap-2">
									<h4 class="font-semibold">{{ formatNamedWithSpecialization(talent.name, talent.specialization) }}</h4>
                  <div class="hover-actions flex items-center gap-1">
										<button
											v-if="talent.description"
                      class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11"
											aria-label="Afficher la description du talent"
											@click="openDescriptionModal(formatNamedWithSpecialization(talent.name, talent.specialization), talent.description)"
										>
											<Info class="h-4 w-4" />
										</button>
                    <button v-if="canEditQuickSection" class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11" @click="onDeleteTalent(talent.talentId)">
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
								</div>
							</div>
						</article>
					</div>
				</div>
			</details>

			<dialog ref="descriptionDialogRef" class="modal modal-top sm:modal-middle" @close="closeDescriptionModal">
        <div class="modal-box grim-modal-box p-6 max-w-lg">
          <button class="btn btn-sm btn-circle grim-modal-close absolute right-3 top-3" @click="closeDescriptionModal" aria-label="Fermer">✕</button>
          <h3 class="grim-modal-title text-2xl pr-8">{{ descriptionTitle || 'Description' }}</h3>
					<p class="mt-3 whitespace-pre-line text-sm opacity-90">{{ descriptionContent || 'Aucune description.' }}</p>
				</div>
				<form method="dialog" class="modal-backdrop">
					<button>Fermer</button>
				</form>
			</dialog>

			<details class="collapse collapse-arrow border border-base-300 bg-base-100">
				<summary class="collapse-title">
          <h2 class="text-lg">Armes</h2>
				</summary>
				<div class="collapse-content">
          <div v-if="canEditQuickSection" class="mb-3 flex justify-start">
            <button class="btn btn-sm btn-square min-h-11 min-w-11" aria-label="Ajouter des armes" @click.stop.prevent="openCatalogModal('weapons')">
              <Plus class="h-4 w-4" />
            </button>
          </div>
					<div v-if="sortedCharacterWeapons.length === 0" class="text-sm opacity-70">Aucune arme.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="weapon in sortedCharacterWeapons" :key="weapon.id" v-memo="[weapon.equipped, weapon.quality, canEditQuickSection]" class="card border border-base-300 bg-base-100 hover:border-primary transition-colors">
							<div class="card-body p-3 gap-2">
								<div class="flex items-start justify-between gap-2">
									<h4 class="font-semibold flex-1 min-w-0 break-words leading-tight">{{ weapon.name }}</h4>
									<div class="flex items-center gap-1">
                    <button v-if="canEditQuickSection" class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11" @click="onDeleteWeapon(weapon.id)">
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
								</div>
								<p v-if="weapon.description" class="text-sm opacity-70">{{ weapon.description }}</p>
                <div class="flex items-center gap-2 flex-wrap">
                  <StateCycleBadge
                    v-if="canEditQuickSection"
                    :value="weapon.equipped"
                    :options="WEAPON_EQUIPPED_OPTIONS"
                    @change="onWeaponStateChange(weapon, $event)"
                  />
                  <span
                    v-else
                    class="badge badge-sm"
                    :class="weapon.equipped ? 'badge-secondary' : 'badge-outline'"
                  >
                    {{ weapon.equipped === null ? 'Inventaire' : weapon.equipped === 'd&g' ? 'Deux mains' : weapon.equipped === 'droite' ? 'Droite' : 'Gauche' }}
                  </span>
									<StateCycleBadge
										v-if="canEditQuickSection"
										:value="weapon.quality"
										:options="ITEM_QUALITY_STATE_OPTIONS"
										@change="onWeaponQualityChange(weapon, $event)"
									/>
									<span v-else class="badge badge-sm" :class="qualityBadgeClass(weapon.quality)">{{ weapon.quality || 'normal' }}</span>
									<span class="badge badge-sm badge-outline gap-1"><Weight class="h-3 w-3" /> {{ weapon.encumbrance }}</span>
									<span v-if="weapon.damageFormula" class="badge badge-sm badge-outline gap-1"><Sword class="h-3 w-3" /> {{ weapon.damageFormula }}</span>
								</div>
							</div>
						</article>
					</div>
				</div>
			</details>

			<details class="collapse collapse-arrow border border-base-300 bg-base-100">
				<summary class="collapse-title">
          <h2 class="text-lg">Armures</h2>
				</summary>
				<div class="collapse-content">
          <div v-if="canEditQuickSection" class="mb-3 flex justify-start">
            <button class="btn btn-sm btn-square min-h-11 min-w-11" aria-label="Ajouter des armures" @click.stop.prevent="openCatalogModal('armors')">
              <Plus class="h-4 w-4" />
            </button>
          </div>
					<div v-if="sortedCharacterArmors.length === 0" class="text-sm opacity-70">Aucune armure.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="armor in sortedCharacterArmors" :key="armor.id" v-memo="[armor.isEquipped, armor.quality, canEditQuickSection]" class="card border border-base-300 bg-base-100 hover:border-primary transition-colors">
							<div class="card-body p-3 gap-2">
								<div class="flex items-start justify-between gap-2">
									<h4 class="font-semibold flex-1 min-w-0 break-words leading-tight">{{ armor.name }}</h4>
									<div class="flex items-center gap-1">
                    <button v-if="canEditQuickSection" class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11" @click="onDeleteArmor(armor.id)">
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
								</div>
								<p v-if="armor.description" class="text-sm opacity-70">{{ armor.description }}</p>
                <div class="flex items-center gap-2 flex-wrap">
                  <StateCycleBadge
                    v-if="canEditQuickSection"
                    :value="armor.isEquipped"
                    :options="ARMOR_EQUIPPED_OPTIONS"
                    @change="onArmorStateChange(armor, $event)"
                  />
                  <span
                    v-else
                    class="badge badge-sm"
                    :class="armor.isEquipped ? 'badge-success' : 'badge-outline'"
                  >
                    {{ armor.isEquipped ? 'Équipée' : 'Inventaire' }}
                  </span>
									<StateCycleBadge
										v-if="canEditQuickSection"
										:value="armor.quality"
										:options="ITEM_QUALITY_STATE_OPTIONS"
										@change="onArmorQualityChange(armor, $event)"
									/>
									<span v-else class="badge badge-sm" :class="qualityBadgeClass(armor.quality)">{{ armor.quality || 'normal' }}</span>
									<span class="badge badge-sm badge-outline gap-1"><Weight class="h-3 w-3" /> {{ armor.encumbrance }}</span>
									<span class="badge badge-sm badge-outline gap-1"><Shield class="h-3 w-3" /> {{ armor.armorPoints }}</span>
									<span v-if="armor.coveredLocations?.length" class="w-full text-xs opacity-75 break-words">{{ armor.coveredLocations.join(', ') }}</span>
								</div>
							</div>
						</article>
					</div>
				</div>
			</details>

			<details class="collapse collapse-arrow border border-base-300 bg-base-100">
				<summary class="collapse-title">
          <h2 class="text-lg">Équipements</h2>
				</summary>
				<div class="collapse-content">
          <div v-if="canEditQuickSection" class="mb-3 flex justify-start">
            <button class="btn btn-sm btn-square min-h-11 min-w-11" aria-label="Ajouter des équipements" @click.stop.prevent="openCatalogModal('items')">
              <Plus class="h-4 w-4" />
            </button>
          </div>
					<div v-if="sortedCharacterItems.length === 0" class="text-sm opacity-70">Aucun équipement.</div>
					<div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<article v-for="item in sortedCharacterItems" :key="item.id" v-memo="[item.quantity, item.quality, canEditQuickSection]" class="card border border-base-300 bg-base-100 hover:border-primary transition-colors">
							<div class="card-body p-3 gap-2">
								<div class="flex items-start justify-between gap-2">
									<h4 class="font-semibold flex-1 min-w-0 break-words leading-tight">{{ item.name }}</h4>
									<div class="flex items-center gap-1">
										<button
											v-if="item.description"
                      class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11"
											aria-label="Afficher la description de l'équipement"
											@click="openDescriptionModal(item.name, item.description)"
										>
											<Info class="h-4 w-4" />
										</button>
										<button
											v-if="canEditQuickSection"
                      class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11 text-error"
											aria-label="Retirer l'équipement de l'inventaire"
											@click="onDeleteItem(item.id)"
										>
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
								</div>
								<div class="flex gap-1 flex-wrap">
									<StateCycleBadge
										v-if="canEditQuickSection"
										:value="item.quality"
										:options="ITEM_QUALITY_STATE_OPTIONS"
										@change="onItemQualityChange(item, $event)"
									/>
									<span v-else class="badge badge-sm" :class="qualityBadgeClass(item.quality)">{{ item.quality || 'normal' }}</span>
									<span class="badge badge-sm badge-outline gap-1"><Weight class="h-3 w-3" /> {{ item.encumbrance }}</span>
									<div v-if="canEditQuickSection" class="join items-stretch">
										<button
                      class="btn btn-sm h-11 min-h-11 min-w-11 join-item px-3 text-base font-semibold leading-none"
											:disabled="item.quantity <= 1"
											aria-label="Réduire la quantité"
											@click="onChangeItemQuantity(item, -1)"
										>
											-
										</button>
                    <span class="join-item inline-flex h-11 min-h-11 min-w-12 items-center justify-center bg-secondary px-3 text-sm font-bold tracking-wide text-secondary-content border-none">x{{ item.quantity }}</span>
										<button
                      class="btn btn-sm h-11 min-h-11 min-w-11 join-item px-3 text-base font-semibold leading-none"
											aria-label="Augmenter la quantité"
											@click="onChangeItemQuantity(item, 1)"
										>
											+
										</button>
									</div>
									<span v-else class="badge badge-sm badge-secondary font-bold tracking-wide text-secondary-content">x{{ item.quantity }}</span>
								</div>
							</div>
						</article>
					</div>
				</div>
			</details>

			<dialog ref="statsImportDialogRef" class="modal modal-top sm:modal-middle" @close="closeStatsImportModal">
        <div class="modal-box grim-modal-box p-4 sm:p-6 max-w-3xl">
          <button class="btn btn-sm btn-circle grim-modal-close absolute right-3 top-3" @click="closeStatsImportModal" aria-label="Fermer">✕</button>
          <h3 class="grim-modal-title text-2xl pr-8">Import rapide des avancées de carrière</h3>
					<p class="mt-1 text-xs opacity-70">Renseigne les valeurs d'avancée totale (0-99). Laisse vide pour ignorer une caractéristique.</p>

					<div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
						<label
							v-for="stat in allStatsSorted"
							:key="`import-${stat.statCode}`"
							class="fieldset rounded-box border border-base-300 p-2"
						>
							<span class="fieldset-legend text-xs">{{ stat.statCode.toUpperCase() }}</span>
							<input
								:value="statsImportValues[stat.statCode]"
								type="text"
								inputmode="numeric"
								pattern="^[0-9]{0,2}$"
								maxlength="2"
								class="input input-xs w-full text-center tabular-nums"
								:aria-label="`Avancée totale ${stat.statCode}`"
								@input="onStatsImportInput(stat.statCode, $event)"
							/>
						</label>
					</div>

					<div v-if="statsImportError" role="alert" class="alert alert-error alert-soft mt-4">
						<span>{{ statsImportError }}</span>
					</div>

          <div class="grim-modal-actions mt-4 flex items-center justify-end gap-2 border-t border-base-300 pt-3">
						<button type="button" class="btn btn-sm btn-ghost" @click="closeStatsImportModal">Annuler</button>
						<button type="button" class="btn btn-sm" :disabled="statsImportSaving" @click="confirmStatsImport">
							<span v-if="statsImportSaving" class="loading loading-spinner loading-xs" aria-hidden="true" />
							Appliquer
						</button>
					</div>
				</div>
				<form method="dialog" class="modal-backdrop">
					<button>Fermer</button>
				</form>
			</dialog>
		</template>

		<dialog ref="careerDialogRef" class="modal modal-top sm:modal-middle" @close="closeCareerModal">
      <div class="modal-box grim-modal-box p-6">
        <button class="btn btn-sm btn-circle grim-modal-close absolute right-3 top-3" @click="closeCareerModal" aria-label="Fermer">✕</button>
        <h3 class="grim-modal-title mb-4 text-center text-3xl">Changer de carrière</h3>

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

          <div class="grim-modal-actions flex items-center justify-end gap-2">
						<button class="btn btn-sm" @click="closeCareerModal">Annuler</button>
            <button class="btn btn-sm" :disabled="changingCareer" @click="confirmCareerChange">
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

		<dialog ref="catalogDialogRef" class="modal modal-top sm:modal-middle" @close="closeCatalogModal">
      <div class="modal-box grim-modal-box w-11/12 max-w-2xl p-4 sm:p-6 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        <button class="btn btn-sm btn-circle grim-modal-close absolute right-4 top-4" @click="closeCatalogModal" aria-label="Fermer">✕</button>
        <h3 class="grim-modal-title mb-4 pr-8 text-center text-2xl sm:text-3xl text-primary">Ajouter des {{ modalSectionLabel }}</h3>

				<div v-if="catalogSection === 'items'" class="mb-4 flex justify-center">
					<div class="join">
						<button
							type="button"
							class="btn btn-sm join-item"
							:class="itemCatalogMode === 'search' ? 'btn-active' : ''"
							@click="itemCatalogMode = 'search'"
						>
							Recherche
						</button>
						<button
							type="button"
							class="btn btn-sm join-item"
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
                <p v-else class="text-center text-sm opacity-70 py-8">Aucun élément trouvé.</p>
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
						<button class="btn btn-sm btn-ghost" @click="closeCatalogModal">Annuler</button>
						<button
							v-if="catalogSection === 'items' && itemCatalogMode === 'create'"
              class="btn btn-sm"
							:disabled="creatingItem"
							@click="confirmItemCreate"
						>
							<span v-if="creatingItem" class="loading loading-spinner loading-xs" aria-hidden="true" />
							Créer et ajouter
						</button>
						<button
							v-else
              class="btn btn-sm"
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

    <!-- Pied de page navigation -->
    <footer class="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/95 px-3 py-2 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
      <div class="mx-auto flex w-full max-w-6xl gap-2">
        <router-link v-if="character" class="btn btn-sm min-h-11 flex-1" :to="`/campaigns/${character.campaignId}`">
          <ChevronLeft class="h-4 w-4" />
          Retour à la campagne
        </router-link>
        <router-link class="btn btn-sm min-h-11 flex-1" to="/">
          <ChevronLeft class="h-4 w-4" />
          Menu principal
        </router-link>
      </div>
    </footer>
	</main>
</template>

<script setup lang="ts">
import {
  ChevronLeft,
  CircleX,
  Import,
  Info,
  LoaderCircle,
  Clover,
  Heart,
  Mars,
  Pencil,
  Plus,
  ScrollText,
  Hospital,
  Shield,
  Sword,
  Trash2,
  UserCog,
  WandSparkles,
  Venus,
  Weight,
} from '@lucide/vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { createCatalogItem, searchCatalog } from '../../repositories/catalogRepository'
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
} from '../../repositories/characterLinksRepository'
import {
  getCharacterById,
  updateCharacterCareer,
  updateCharacterCore,
  updateCharacterStatValues,
} from '../../repositories/charactersRepository'
import { useAuthStore } from '../../stores/auth'
import type {
  CatalogItem,
  CharacterArmor,
  CharacterDetail,
  CharacterItem,
  CharacterSkill,
  CharacterTalent,
  CharacterWeapon,
} from '../../types/domain'
import AppCard from '../components/AppCard.vue'
import CharacterDerivedStatsCard from '../components/CharacterDerivedStatsCard.vue'
import CharacteristicCard from '../components/CharacteristicCard.vue'
import CharacterMoneyCard from '../components/CharacterMoneyCard.vue'
import CharacterValueCard from '../components/CharacterValueCard.vue'
import SearchInput from '../components/SearchInput.vue'
import StateCycleBadge from '../components/StateCycleBadge.vue'
import { useLiveSave } from '../composables/useLiveSave'
import { useMoneyCoercion } from '../composables/useMoneyCoercion'
import {
  type RealtimeUpdatePayload,
  useRealtimeChannels,
} from '../composables/useRealtimeChannels'

type CatalogSection = 'skills' | 'talents' | 'weapons' | 'armors' | 'items'

const CHARACTERISTICS_ORDER = [
  'CC',
  'CT',
  'F',
  'E',
  'AG',
  'INT',
  'FM',
  'SOC',
  'A',
  'M',
  'MAG',
] as const
const CHARACTERISTICS_INDEX = new Map<string, number>(
  CHARACTERISTICS_ORDER.map((code, index) => [code, index])
)
const CATALOG_LABELS: Record<CatalogSection, string> = {
  skills: 'compétences',
  talents: 'talents',
  weapons: 'armes',
  armors: 'armures',
  items: 'équipements',
}

const WEAPON_EQUIPPED_OPTIONS = [
  { value: null, label: 'Inventaire', badgeClass: 'btn-outline' },
  { value: 'droite', label: 'Droite', badgeClass: 'btn-secondary' },
  { value: 'gauche', label: 'Gauche', badgeClass: 'btn-secondary' },
  { value: 'd&g', label: 'Deux mains', badgeClass: 'btn-secondary' },
] as const

const ARMOR_EQUIPPED_OPTIONS = [
  { value: false, label: 'Inventaire', badgeClass: 'btn-outline' },
  { value: true, label: 'Équipée', badgeClass: 'btn-success' },
] as const

const CHARACTERISTICS_VIEW_OPTIONS = [
  { value: 'compact', label: 'Compact', badgeClass: 'btn-neutral' },
  { value: 'normal', label: 'Détaillé', badgeClass: 'btn-outline' },
] as const

const route = useRoute()
const authStore = useAuthStore()
const { coerceMoney } = useMoneyCoercion()
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const character = ref<CharacterDetail | null>(null)
const characterId = computed(() => String(route.params.id ?? ''))
const isMoneyEditing = ref(false)
let deferredRealtimeReloadTimer: ReturnType<typeof setTimeout> | null = null
let deferredLinksReloadTimer: ReturnType<typeof setTimeout> | null = null

const careerDialogRef = ref<HTMLDialogElement | null>(null)
const careerQuery = ref('')
const careerOptions = ref<CatalogItem[]>([])
const selectedCareerId = ref<string | null>(null)
const selectedCareerName = ref<string | null>(null)
const careerError = ref<string | null>(null)
const changingCareer = ref(false)

const catalogDialogRef = ref<HTMLDialogElement | null>(null)
const descriptionDialogRef = ref<HTMLDialogElement | null>(null)
const statsImportDialogRef = ref<HTMLDialogElement | null>(null)
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
let catalogSearchTimer: ReturnType<typeof setTimeout> | null = null
let catalogSearchSequence = 0
const ITEM_QUALITY_OPTIONS = ['médiocre', 'normal', 'bonne', 'exceptionelle'] as const
const ITEM_QUALITY_STATE_OPTIONS = ITEM_QUALITY_OPTIONS.map((quality) => ({
  value: quality,
  label: quality,
  badgeClass: qualityStateClass(quality),
}))
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
const statsImportValues = ref<Record<string, string>>({})
const statsImportError = ref<string | null>(null)
const statsImportSaving = ref(false)

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
const characteristicsViewMode = ref<'normal' | 'compact'>('compact')
const modalSectionLabel = computed(() => CATALOG_LABELS[catalogSection.value])

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

const visibleStats = computed(() => {
  if (!character.value) {
    return []
  }

  return character.value.stats
    .filter((stat) => {
      const normalized = stat.statCode.trim().toUpperCase()
      return normalized !== 'B' && normalized !== 'PD'
    })
    .sort((left, right) => {
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

const primaryStats = computed(() =>
  visibleStats.value.filter((stat) => !stat.isSecondary).slice(0, 8)
)
const secondaryStats = computed(() => visibleStats.value.filter((stat) => stat.isSecondary))
const primaryStatsRows = computed(() => [
  primaryStats.value.slice(0, 4),
  primaryStats.value.slice(4, 8),
])

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

  const enduranceStat = character.value.stats.find(
    (stat) => stat.statCode.trim().toUpperCase() === 'E'
  )
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
  const weaponsEncumbrance = characterWeapons.value.reduce(
    (total, weapon) => total + (weapon.encumbrance ?? 0),
    0
  )
  const armorsEncumbrance = characterArmors.value.reduce(
    (total, armor) => total + (armor.encumbrance ?? 0),
    0
  )
  const itemsEncumbrance = characterItems.value.reduce(
    (total, item) => total + (item.encumbrance ?? 0) * Math.max(1, item.quantity),
    0
  )

  return weaponsEncumbrance + armorsEncumbrance + itemsEncumbrance
})

const armorByLocation = computed(() => {
  const totals = {
    tete: 0,
    corps: 0,
    bras: 0,
    jambes: 0,
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

const { status, triggerSave, triggerSaveNow } = useLiveSave(
  async (payload: typeof editable.value) => {
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
      insanity_points: Math.max(0, payload.insanityPoints),
      money_gold: payload.moneyGold,
      money_silver: payload.moneySilver,
      money_copper: payload.moneyCopper,
    })

    markSavedEditable(payload)
  },
  500
)

const {
  status: statSaveStatus,
  triggerSave: triggerStatSave,
  triggerSaveNow: triggerStatSaveNow,
} = useLiveSave(
  async (payload: {
    statCode: string
    currentAdvanced?: number
    baseValue?: number
    totalAdvanced?: number
  }) => {
    if (!character.value) {
      return
    }

    await updateCharacterStatValues(character.value.id, payload.statCode, {
      current_advanced: payload.currentAdvanced,
      base_value: payload.baseValue,
      total_advanced: payload.totalAdvanced,
    })
  },
  350
)

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

function invalidateCurrentLinksCache(): void {
  const currentCharacterId = character.value?.id ?? characterId.value
  if (!currentCharacterId) {
    return
  }

  invalidateCharacterLinksCache(currentCharacterId)
}

const allStatsSorted = computed(() => {
  if (!character.value) {
    return []
  }

  return [...character.value.stats].sort((left, right) => {
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
      if (deferredLinksReloadTimer) {
        clearTimeout(deferredLinksReloadTimer)
      }

      deferredLinksReloadTimer = setTimeout(() => {
        void loadCharacterLinks(currentCharacterId, { force: true })
      }, 700)
      return
    }

    void loadCharacterLinks(currentCharacterId, { force: true })
    return
  }

  if (isSavingInProgress()) {
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

    const nextEditable = {
      pvMax: data.pvMax,
      pvCurrent: data.pvCurrent,
      fortuneMax: data.fortuneMax,
      fortuneCurrent: data.fortuneCurrent,
      destinyCurrent: data.destinyCurrent,
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
    markSavedEditable(nextEditable)

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

function onQuickValueChange(field: keyof typeof editable.value, value: number): void {
  const previousValue = editable.value[field]
  const newValue = Math.max(0, value)
  const isMoneyField = field === 'moneyGold' || field === 'moneySilver' || field === 'moneyCopper'

  // Constraint: current <= max for resource types
  if (field === 'pvCurrent' && editable.value.pvMax !== undefined) {
    editable.value[field] = Math.min(newValue, editable.value.pvMax) as never
  } else if (field === 'fortuneCurrent' && editable.value.fortuneMax !== undefined) {
    editable.value[field] = Math.min(newValue, editable.value.fortuneMax) as never
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

function onCharacteristicsViewModeChange(value: string | boolean | null): void {
  if (value === 'normal' || value === 'compact') {
    characteristicsViewMode.value = value
  }
}

function openStatsImportModal(): void {
  if (!character.value) {
    return
  }

  statsImportError.value = null
  statsImportSaving.value = false
  statsImportValues.value = Object.fromEntries(
    character.value.stats.map((stat) => [stat.statCode, ''])
  )
  statsImportDialogRef.value?.showModal()
}

function closeStatsImportModal(): void {
  if (statsImportDialogRef.value?.open) {
    statsImportDialogRef.value.close()
  }
  statsImportError.value = null
  statsImportSaving.value = false
  statsImportValues.value = {}
}

function onStatsImportInput(statCode: string, event: Event): void {
  const target = event.target as HTMLInputElement
  const normalized = target.value.replace(/\D/g, '').slice(0, 2)
  statsImportValues.value = {
    ...statsImportValues.value,
    [statCode]: normalized,
  }
  target.value = normalized
}

async function confirmStatsImport(): Promise<void> {
  if (!character.value || !canEditQuickSection.value || statsImportSaving.value) {
    return
  }

  const updates = Object.entries(statsImportValues.value)
    .map(([statCode, rawValue]) => ({ statCode, rawValue: rawValue.trim() }))
    .filter(({ rawValue }) => rawValue.length > 0)
    .filter(({ statCode, rawValue }) => {
      const parsedValue = Math.max(0, Math.min(99, Number(rawValue)))
      const localStat = character.value?.stats.find((stat) => stat.statCode === statCode)
      return localStat ? localStat.totalAdvanced !== parsedValue : true
    })

  if (updates.length === 0) {
    closeStatsImportModal()
    return
  }

  statsImportSaving.value = true
  statsImportError.value = null
  try {
    for (const update of updates) {
      const parsedValue = Math.max(0, Math.min(99, Number(update.rawValue)))
      await triggerStatSaveNow({ statCode: update.statCode, totalAdvanced: parsedValue })

      const localStat = character.value.stats.find((stat) => stat.statCode === update.statCode)
      if (localStat) {
        localStat.totalAdvanced = parsedValue
      }
    }

    await loadCharacter({ background: true })
    closeStatsImportModal()
  } catch (error) {
    statsImportError.value = error instanceof Error ? error.message : 'Import impossible.'
  } finally {
    statsImportSaving.value = false
  }
}

async function onChangeSkillMastery(skillId: string, level: 1 | 2 | 3): Promise<void> {
  if (!character.value || !canEditQuickSection.value) {
    return
  }

  const target = characterSkills.value.find((skill) => skill.skillId === skillId)
  if (target && target.masteryLevel === level) {
    return
  }

  try {
    await updateCharacterSkillMastery(character.value.id, skillId, level)
    if (target) {
      target.masteryLevel = level
    }
    invalidateCurrentLinksCache()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Modification du niveau de maitrise impossible.'
  }
}

async function onDeleteSkill(skillId: string): Promise<void> {
  if (!character.value || !canEditQuickSection.value) {
    return
  }

  try {
    await removeCharacterSkill(character.value.id, skillId)
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
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
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
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
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
  }
}

function canEquipWeaponCheck(
  _weapon: CharacterWeapon,
  _targetEquipped: 'droite' | 'gauche' | 'd&g' | null
): boolean {
  // Placeholder for future weapon rules validation.
  return true
}

async function onWeaponStateChange(
  weapon: CharacterWeapon,
  value: string | boolean | null
): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  if (value !== null && value !== 'droite' && value !== 'gauche' && value !== 'd&g') {
    return
  }

  const nextEquipped: 'droite' | 'gauche' | 'd&g' | null = value
  if (weapon.equipped === nextEquipped) {
    return
  }

  if (!canEquipWeaponCheck(weapon, nextEquipped)) {
    return
  }

  try {
    await updateCharacterWeaponEquipped(weapon.id, nextEquipped)
    weapon.equipped = nextEquipped
    invalidateCurrentLinksCache()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
  }
}

async function onWeaponQualityChange(
  weapon: CharacterWeapon,
  quality: string | boolean | null
): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  if (
    quality !== 'médiocre' &&
    quality !== 'normal' &&
    quality !== 'bonne' &&
    quality !== 'exceptionelle'
  ) {
    return
  }

  if (quality === weapon.quality) {
    return
  }

  try {
    await updateCharacterWeaponQuality(weapon.id, quality)
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
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
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
  }
}

function canEquipArmorCheck(_armor: CharacterArmor, _targetEquipped: boolean): boolean {
  // Placeholder for future armor rules validation.
  return true
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

  if (!canEquipArmorCheck(armor, nextEquipped)) {
    return
  }

  try {
    await updateCharacterArmorEquipped(armor.id, nextEquipped)
    armor.isEquipped = nextEquipped
    invalidateCurrentLinksCache()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
  }
}

async function onArmorQualityChange(
  armor: CharacterArmor,
  quality: string | boolean | null
): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  if (
    quality !== 'médiocre' &&
    quality !== 'normal' &&
    quality !== 'bonne' &&
    quality !== 'exceptionelle'
  ) {
    return
  }

  if (quality === armor.quality) {
    return
  }

  try {
    await updateCharacterArmorQuality(armor.id, quality)
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
  }
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
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  try {
    await removeCharacterItem(linkId)
    invalidateCurrentLinksCache()
    await loadCharacterLinks(character.value.id, { force: true })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
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

  try {
    await updateCharacterItemQuantity(item.id, nextQuantity)
    item.quantity = nextQuantity
    invalidateCurrentLinksCache()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
  }
}

async function onItemQualityChange(
  item: CharacterItem,
  quality: string | boolean | null
): Promise<void> {
  if (!canEditQuickSection.value || !character.value) {
    return
  }

  if (
    quality !== 'médiocre' &&
    quality !== 'normal' &&
    quality !== 'bonne' &&
    quality !== 'exceptionelle'
  ) {
    return
  }

  if (quality === item.quality) {
    return
  }

  try {
    await updateCharacterItemQuality(item.id, quality)
    item.quality = quality
    invalidateCurrentLinksCache()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
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

  if (selectedCareerId.value === character.value.careerId) {
    closeCareerModal()
    return
  }

  changingCareer.value = true
  careerError.value = null
  try {
    await updateCharacterCareer(character.value.id, selectedCareerId.value)
    await loadCharacter()
    closeCareerModal()
  } catch (error) {
    careerError.value =
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
  itemCatalogMode.value = 'search'
  creatingItem.value = false
  resetSelectedItemsSettings()
  resetNewItemForm()
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
    closeCatalogModal()
  } catch (error) {
    catalogError.value = error instanceof Error ? error.message : 'Création impossible.'
  } finally {
    creatingItem.value = false
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
  if (catalogSearchTimer) {
    clearTimeout(catalogSearchTimer)
    catalogSearchTimer = null
  }

  if (catalogSection.value === 'items' && itemCatalogMode.value === 'create') {
    catalogOptions.value = []
    return
  }

  const trimmed = value.trim()
  if (trimmed.length < 2) {
    catalogOptions.value = []
    return
  }

  const requestId = ++catalogSearchSequence
  catalogSearchTimer = setTimeout(async () => {
    try {
      const results = await searchCatalog(catalogSection.value, trimmed)
      if (requestId !== catalogSearchSequence) {
        return
      }

      catalogOptions.value = results
    } catch {
      if (requestId !== catalogSearchSequence) {
        return
      }

      catalogOptions.value = []
    }
  }, 180)
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

function qualityBadgeClass(quality: string | null): string {
  const normalized = quality?.trim().toLowerCase() ?? ''
  if (normalized === 'médiocre') {
    return 'badge-warning'
  }
  if (normalized === 'normal') {
    return 'badge-neutral'
  }
  if (normalized === 'bonne') {
    return 'badge-info'
  }
  if (normalized === 'exceptionelle') {
    return 'badge-success'
  }
  return 'badge-outline'
}

function qualityStateClass(quality: string | null): string {
  const normalized = quality?.trim().toLowerCase() ?? ''
  if (normalized === 'médiocre') {
    return 'btn-warning'
  }
  if (normalized === 'normal') {
    return 'btn-neutral'
  }
  if (normalized === 'bonne') {
    return 'btn-info'
  }
  if (normalized === 'exceptionelle') {
    return 'btn-success'
  }
  return 'btn-outline'
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
  if (deferredRealtimeReloadTimer) {
    clearTimeout(deferredRealtimeReloadTimer)
    deferredRealtimeReloadTimer = null
  }

  if (deferredLinksReloadTimer) {
    clearTimeout(deferredLinksReloadTimer)
    deferredLinksReloadTimer = null
  }

  if (catalogSearchTimer) {
    clearTimeout(catalogSearchTimer)
    catalogSearchTimer = null
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