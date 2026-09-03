<script setup lang="ts">
import { Weight } from '@lucide/vue'
import { computed } from 'vue'
import type { CharacterArmor, CharacterWeapon } from '../../types/domain'
import type { ArmorByLocation, WeaponHand } from '../../utils/equipmentSlots'
import CharacterEquipmentDoll from './CharacterEquipmentDoll.vue'

const props = withDefaults(
  defineProps<{
    totalEncumbrance: number
    maxEncumbrance: number
    bonusForce: number
    bonusEndurance: number
    armorByLocation: ArmorByLocation
    armors?: CharacterArmor[]
    weapons?: CharacterWeapon[]
    editable?: boolean
    busy?: boolean
  }>(),
  {
    totalEncumbrance: 0,
    maxEncumbrance: 0,
    bonusForce: 0,
    bonusEndurance: 0,
    armors: () => [],
    weapons: () => [],
    editable: false,
    busy: false,
  }
)

defineEmits<{
  'equip-armor': [armorId: string]
  'unequip-armor': [armorId: string]
  'unequip-armors': [armorIds: string[]]
  'equip-weapon': [weaponId: string, hand: WeaponHand]
  'unequip-weapon': [weaponId: string]
}>()

const isEncumbranceOverLimit = computed(() => props.totalEncumbrance > props.maxEncumbrance)
const encumbranceProgressMax = computed(() => Math.max(props.maxEncumbrance, 1))
const encumbranceProgressValue = computed(() =>
  Math.min(props.totalEncumbrance, encumbranceProgressMax.value)
)
</script>

<template>
  <article class="card border border-base-300 bg-base-100">
    <div class="card-body gap-3 p-4">
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div class="space-y-2">
          <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-center">
            <div class="mb-2 flex items-center justify-between gap-2">
              <p class="text-xs font-semibold uppercase tracking-wide opacity-75">Encombrement</p>
              <Weight class="h-5 w-5 text-accent" aria-hidden="true" />
              <p class="text-xs opacity-50">Enc. max : 2xF ou 3xF nains</p>
            </div>
            <div class="relative">
              <progress
                class="progress progress-accent h-10 w-full bg-base-100"
                :value="encumbranceProgressValue"
                :max="encumbranceProgressMax"
              />
              <span
                class="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-black sm:text-xl"
                :class="isEncumbranceOverLimit ? 'text-error' : 'text-accent'"
              >
                {{ totalEncumbrance }} / {{ maxEncumbrance }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-center">
              <div class="text-sm font-bold uppercase text-accent">BF</div>
              <p class="text-center text-3xl font-black leading-none text-accent">{{ bonusForce }}</p>
            </div>
            <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-center">
              <div class="text-sm font-bold uppercase text-accent">BE</div>
              <p class="text-center text-3xl font-black leading-none text-accent">{{ bonusEndurance }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-200 p-3">
          <CharacterEquipmentDoll
            :armors="armors"
            :weapons="weapons"
            :armor-by-location="armorByLocation"
            :editable="editable"
            :busy="busy"
            @equip-armor="$emit('equip-armor', $event)"
            @unequip-armor="$emit('unequip-armor', $event)"
            @unequip-armors="$emit('unequip-armors', $event)"
            @equip-weapon="(id, hand) => $emit('equip-weapon', id, hand)"
            @unequip-weapon="$emit('unequip-weapon', $event)"
          />
        </div>
      </div>
    </div>
  </article>
</template>
