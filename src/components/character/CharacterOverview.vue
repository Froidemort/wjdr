<script setup lang="ts">
import { Hospital, ScrollText, Weight } from '@lucide/vue'
import { computed } from 'vue'
import type { CharacterRace } from '../../types/character'
import type { CharacterQuickField, CharacterQuickValues } from '../../types/characterSheet'
import type { CharacterArmor, CharacterItem, CharacterStatValue, CharacterWeapon } from '../../types/domain'
import {
  computeMaxEncumbrance,
  computeTotalEncumbrance,
  getStatBonus,
} from '../../utils/characterSheet'
import { computeArmorByLocation, type WeaponHand } from '../../utils/equipmentSlots'
import CharacterDerivedStatsCard from '../ui/CharacterDerivedStatsCard.vue'
import CharacterValueCard from '../ui/CharacterValueCard.vue'
import FortuneClover from '../ui/FortuneClover.vue'
import HealthHeart from '../ui/HealthHeart.vue'

const props = defineProps<{
  race: CharacterRace
  stats: CharacterStatValue[]
  armors: CharacterArmor[]
  weapons: CharacterWeapon[]
  items: CharacterItem[]
  values: CharacterQuickValues
  editable: boolean
  busy: boolean
}>()

const emit = defineEmits<{
  'quick-change': [field: CharacterQuickField, value: number]
  'equip-armor': [armorId: string]
  'unequip-armor': [armorId: string]
  'unequip-armors': [armorIds: string[]]
  'equip-weapon': [weaponId: string, hand: WeaponHand]
  'unequip-weapon': [weaponId: string]
}>()

const bonusForce = computed(() => getStatBonus(props.stats, 'F'))
const bonusEndurance = computed(() => getStatBonus(props.stats, 'E'))
const maxEncumbrance = computed(() => computeMaxEncumbrance(props.race, props.stats))
const totalEncumbrance = computed(() =>
  computeTotalEncumbrance({ weapons: props.weapons, armors: props.armors, items: props.items })
)
const isOverloaded = computed(() => totalEncumbrance.value > maxEncumbrance.value)
const armorByLocation = computed(() => computeArmorByLocation(props.armors))
const encumbranceMultiplier = computed(() => (props.race === 'nain' ? 20 : 10))
</script>

<template>
  <section
    id="character-panel-overview"
    role="tabpanel"
    aria-labelledby="character-tab-overview"
    class="scroll-mt-20 space-y-3 rounded-box border border-base-300 bg-base-100 p-3 sm:p-4"
  >
    <h2 class="text-lg font-semibold">Aperçu</h2>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <HealthHeart
        :model-value="values.pvCurrent"
        :max-hp="values.pvMax"
        label="Points de Blessures"
        mobile-label="Blessures"
        :editable="editable"
        @update:model-value="emit('quick-change', 'pvCurrent', $event)"
      />
      <FortuneClover
        label="Fortune"
        :model-value="values.fortuneCurrent"
        :max-points="values.fortuneMax"
        max-points-editable
        :editable="editable"
        @update:model-value="emit('quick-change', 'fortuneCurrent', $event)"
        @update:max-points="emit('quick-change', 'fortuneMax', $event)"
      />
      <FortuneClover
        label="Destin"
        :model-value="values.destinyCurrent"
        :max-points="values.destinyMax"
        max-points-editable
        variant="destin"
        :editable="editable"
        @update:model-value="emit('quick-change', 'destinyCurrent', $event)"
        @update:max-points="emit('quick-change', 'destinyMax', $event)"
      />
    </div>

    <div class="grid grid-cols-2 gap-2 lg:grid-cols-3">
      <article class="col-span-2 rounded-box border border-base-300 bg-base-100 p-3 lg:col-span-1">
        <div class="flex items-center justify-between gap-2">
          <p class="flex items-center gap-2 text-sm font-semibold">
            <Weight class="h-5 w-5 text-accent" aria-hidden="true" />
            Encombrement
          </p>
          <p
            class="text-xl font-black tabular-nums"
            :class="isOverloaded ? 'text-error' : ''"
            :aria-label="`Encombrement ${totalEncumbrance} sur ${maxEncumbrance}`"
          >
            {{ totalEncumbrance }} / {{ maxEncumbrance }}
          </p>
        </div>
        <progress
          class="progress progress-accent mt-2 h-3 w-full"
          :value="Math.min(totalEncumbrance, Math.max(maxEncumbrance, 1))"
          :max="Math.max(maxEncumbrance, 1)"
          aria-hidden="true"
        />
        <p class="mt-1 text-xs opacity-70">
          Max : Force × {{ encumbranceMultiplier }}
        </p>
      </article>

      <CharacterValueCard
        label="Points de folie"
        :icon="Hospital"
        icon-class="h-6 w-6 text-warning"
        :current="values.insanityPoints"
        :editable="editable"
        current-aria-label="Points de folie"
        @update:current="emit('quick-change', 'insanityPoints', $event)"
      />
      <CharacterValueCard
        label="Expérience"
        :icon="ScrollText"
        icon-class="h-6 w-6 text-base-content/80"
        :current="values.xpAvailable"
        :max="values.xpTotal"
        :editable="editable"
        current-aria-label="Expérience disponible"
        max-aria-label="Expérience totale"
        @update:current="emit('quick-change', 'xpAvailable', $event)"
        @update:max="emit('quick-change', 'xpTotal', $event)"
      />
    </div>

    <div class="space-y-2">
      <h3 class="text-base font-semibold">Armes et armures équipées</h3>
      <ul class="flex flex-wrap gap-2" aria-label="Bonus de caractéristiques">
        <li
          class="badge badge-outline font-semibold"
          :aria-label="`Bonus de Force ${bonusForce}`"
          :title="`Bonus de Force ${bonusForce}`"
        >
          BF {{ bonusForce }}
        </li>
        <li
          class="badge badge-outline font-semibold"
          :aria-label="`Bonus d'Endurance ${bonusEndurance}`"
          :title="`Bonus d'Endurance ${bonusEndurance}`"
        >
          BE {{ bonusEndurance }}
        </li>
      </ul>
      <CharacterDerivedStatsCard
        :armor-by-location="armorByLocation"
        :armors="armors"
        :weapons="weapons"
        :editable="editable"
        :busy="busy"
        @equip-armor="emit('equip-armor', $event)"
        @unequip-armor="emit('unequip-armor', $event)"
        @unequip-armors="emit('unequip-armors', $event)"
        @equip-weapon="(weaponId, hand) => emit('equip-weapon', weaponId, hand)"
        @unequip-weapon="emit('unequip-weapon', $event)"
      />
    </div>
  </section>
</template>
