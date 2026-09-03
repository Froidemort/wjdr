<script setup lang="ts">
import { Lock, Shield, Sword, Weight, X } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { CharacterArmor, CharacterWeapon } from '../../types/domain'
import {
  MAX_ARMORS_PER_LOCATION,
  type ArmorSlotId,
  type WeaponHand,
  type WeaponSlotId,
  canEquipArmorStack,
  filterArmorsForSlot,
  getArmorSlot,
  getEquippedArmorsForSlot,
  getWeaponForSlot,
  getWeaponSlot,
  isArmorSlotId,
  isTwoHandedWeapon,
  isWeaponSlotId,
  resolveWeaponEquipHand,
} from '../../utils/equipmentSlots'

const props = withDefaults(
  defineProps<{
    open: boolean
    slotId: ArmorSlotId | WeaponSlotId | null
    armors: CharacterArmor[]
    weapons: CharacterWeapon[]
    editable?: boolean
    busy?: boolean
  }>(),
  {
    editable: false,
    busy: false,
  }
)

const emit = defineEmits<{
  close: []
  'equip-armor': [armorId: string]
  'unequip-armor': [armorId: string]
  'unequip-armors': [armorIds: string[]]
  'equip-weapon': [weaponId: string, hand: WeaponHand]
  'unequip-weapon': [weaponId: string]
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
/** Keep last slot while the dialog closes so content does not flash empty. */
const renderedSlotId = ref<ArmorSlotId | WeaponSlotId | null>(null)

const isArmorSlot = computed(() => renderedSlotId.value !== null && isArmorSlotId(renderedSlotId.value))
const isWeaponSlot = computed(() => renderedSlotId.value !== null && isWeaponSlotId(renderedSlotId.value))

const slotLabel = computed(() => {
  if (!renderedSlotId.value) {
    return ''
  }
  if (isArmorSlotId(renderedSlotId.value)) {
    return getArmorSlot(renderedSlotId.value).label
  }
  return getWeaponSlot(renderedSlotId.value).label
})

const slotHitRange = computed(() => {
  if (!renderedSlotId.value || !isArmorSlotId(renderedSlotId.value)) {
    return null
  }
  return getArmorSlot(renderedSlotId.value).hitRange
})

const filteredArmors = computed(() => {
  if (!renderedSlotId.value || !isArmorSlotId(renderedSlotId.value)) {
    return []
  }
  return filterArmorsForSlot(props.armors, renderedSlotId.value).sort((left, right) => {
    if (left.isEquipped !== right.isEquipped) {
      return left.isEquipped ? -1 : 1
    }
    if (right.armorPoints !== left.armorPoints) {
      return right.armorPoints - left.armorPoints
    }
    return left.name.localeCompare(right.name, 'fr')
  })
})

const equippedArmors = computed(() => filteredArmors.value.filter((armor) => armor.isEquipped))
const inventoryArmors = computed(() => filteredArmors.value.filter((armor) => !armor.isEquipped))

const filteredWeapons = computed(() => {
  if (!isWeaponSlot.value) {
    return []
  }
  return [...props.weapons].sort((left, right) => {
    const leftScore = left.equipped !== null ? 0 : 1
    const rightScore = right.equipped !== null ? 0 : 1
    if (leftScore !== rightScore) {
      return leftScore - rightScore
    }
    return left.name.localeCompare(right.name, 'fr')
  })
})

const equippedArmorsOnSlot = computed(() => {
  if (!renderedSlotId.value || !isArmorSlotId(renderedSlotId.value)) {
    return []
  }
  return getEquippedArmorsForSlot(props.armors, renderedSlotId.value)
})

const stackCount = computed(() => equippedArmorsOnSlot.value.length)
const stackFull = computed(() => stackCount.value >= MAX_ARMORS_PER_LOCATION)
const stackTotalPa = computed(() =>
  equippedArmorsOnSlot.value.reduce((total, armor) => total + armor.armorPoints, 0)
)

const equippedWeaponOnSlot = computed(() => {
  if (!renderedSlotId.value || !isWeaponSlotId(renderedSlotId.value)) {
    return null
  }
  return getWeaponForSlot(props.weapons, renderedSlotId.value)
})

const targetHand = computed(() => {
  if (!renderedSlotId.value || !isWeaponSlotId(renderedSlotId.value)) {
    return null
  }
  return getWeaponSlot(renderedSlotId.value).hand
})

const availableWeapons = computed(() =>
  filteredWeapons.value
    .filter((weapon) => !isWeaponOnThisHand(weapon))
    .map((weapon) => ({
      weapon,
      locationHint: weaponLocationHint(weapon),
      handsLabel: weaponHandsLabel(weapon),
      primaryLabel: weaponPrimaryLabel(weapon),
    }))
)

const depthMarks = computed(() =>
  Array.from({ length: MAX_ARMORS_PER_LOCATION }, (_, index) => index < stackCount.value)
)

watch(
  () => props.slotId,
  (slotId) => {
    if (slotId) {
      renderedSlotId.value = slotId
    }
  },
  { immediate: true }
)

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.slotId) {
      renderedSlotId.value = props.slotId
    }

    await nextTick()
    const dialog = dialogRef.value
    if (!dialog) {
      return
    }

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }
)

onBeforeUnmount(() => {
  dialogRef.value?.close()
})

function onDialogClose(): void {
  emit('close')
}

function closeModal(): void {
  dialogRef.value?.close()
}

function isArmorBlocked(armor: CharacterArmor): boolean {
  if (armor.isEquipped) {
    return false
  }
  return !canEquipArmorStack(props.armors, armor)
}

function onSelectArmor(armor: CharacterArmor): void {
  if (!props.editable || props.busy) {
    return
  }
  if (armor.isEquipped) {
    emit('unequip-armor', armor.id)
    return
  }
  if (isArmorBlocked(armor)) {
    return
  }
  emit('equip-armor', armor.id)
}

function onSelectWeapon(weapon: CharacterWeapon): void {
  if (!props.editable || props.busy || !targetHand.value) {
    return
  }
  const hand = resolveWeaponEquipHand(weapon, targetHand.value)
  if (weapon.equipped === hand) {
    return
  }
  emit('equip-weapon', weapon.id, hand)
}

function onUnequipAllArmors(): void {
  if (!props.editable || props.busy) {
    return
  }
  const ids = equippedArmorsOnSlot.value.map((armor) => armor.id)
  if (ids.length === 0) {
    return
  }
  emit('unequip-armors', ids)
}

function onUnequipWeapon(): void {
  if (!props.editable || props.busy || !equippedWeaponOnSlot.value) {
    return
  }
  emit('unequip-weapon', equippedWeaponOnSlot.value.id)
}

function isWeaponOnThisHand(weapon: CharacterWeapon): boolean {
  if (!targetHand.value) {
    return false
  }
  if (weapon.equipped === 'd&g') {
    return equippedWeaponOnSlot.value?.id === weapon.id
  }
  return weapon.equipped === targetHand.value
}

function weaponLocationHint(weapon: CharacterWeapon): string | null {
  if (isWeaponOnThisHand(weapon) || weapon.equipped === null) {
    return null
  }
  if (weapon.equipped === 'd&g') {
    return 'Deux mains'
  }
  if (weapon.equipped === 'droite') {
    return 'Main droite'
  }
  return 'Main gauche'
}

function weaponPrimaryLabel(weapon: CharacterWeapon): string {
  if (weapon.equipped === null) {
    return 'Équiper'
  }
  return 'Déplacer ici'
}

function weaponHandsLabel(weapon: CharacterWeapon): string {
  return isTwoHandedWeapon(weapon) ? 'Deux mains' : 'Une main'
}

function qualityLabel(quality: string): string {
  const normalized = quality.trim().toLowerCase()
  if (!normalized) {
    return 'Normal'
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function armorActionLabel(armor: CharacterArmor): string {
  if (armor.isEquipped) {
    return 'Retirer'
  }
  if (isArmorBlocked(armor)) {
    return 'Plein'
  }
  return 'Équiper'
}
</script>

<template>
  <dialog ref="dialogRef" class="modal modal-top sm:modal-middle" @close="onDialogClose">
    <div
      class="modal-box grim-modal-box flex max-h-[calc(100vh-2rem)] w-11/12 max-w-lg flex-col overflow-hidden p-0"
    >
      <header
        class="relative border-b border-base-content/10 bg-gradient-to-b from-base-200/55 to-transparent px-4 pb-3.5 pt-4 sm:px-5"
      >
        <div class="min-w-0 pr-10">
          <p class="mb-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-base-content/55">
            Équiper
          </p>
          <h3 class="m-0 font-[family-name:var(--font-grim-title)] text-[1.65rem] leading-tight tracking-wide text-primary">
            {{ slotLabel }}
          </h3>
          <p v-if="slotHitRange" class="mt-1.5 text-[0.78rem] leading-snug opacity-70">
            Localisation
            <span class="font-bold tabular-nums text-base-content">{{ slotHitRange }}</span>
            · max {{ MAX_ARMORS_PER_LOCATION }} couches
          </p>
          <p v-else class="mt-1.5 text-[0.78rem] leading-snug opacity-70">
            Touchez une arme pour l’équiper sur cette main
          </p>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-circle grim-modal-close absolute right-3 top-3"
          aria-label="Fermer"
          @click="closeModal"
        >
          <X class="h-4 w-4" />
        </button>
      </header>

      <div
        v-if="isArmorSlot"
        class="mx-4 mt-3.5 flex flex-wrap items-center justify-between gap-3 border border-base-content/15 bg-base-100 px-3 py-2.5 sm:mx-5"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex gap-1" aria-hidden="true">
            <span
              v-for="(filled, index) in depthMarks"
              :key="index"
              class="size-3.5 border border-base-content/20"
              :class="filled ? 'border-accent/70 bg-accent' : 'bg-base-content/5'"
            />
          </div>
          <div class="flex min-w-0 flex-col gap-0.5">
            <span class="text-[0.62rem] font-bold uppercase tracking-wider opacity-55">Couches</span>
            <span class="text-[0.92rem] font-extrabold tabular-nums leading-none">
              {{ stackCount }}/{{ MAX_ARMORS_PER_LOCATION }}
              <span
                v-if="stackFull"
                class="ml-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-warning"
              >
                plein
              </span>
            </span>
          </div>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1 border border-accent/70 bg-accent px-2 py-1 text-[0.78rem] font-extrabold tabular-nums leading-none text-accent-content"
            :class="{ 'opacity-45': stackCount === 0 }"
          >
            <Shield class="h-3.5 w-3.5" aria-hidden="true" />
            <span>{{ stackTotalPa }}</span>
            <span class="text-[0.62rem] font-bold tracking-wide opacity-85">PA</span>
          </span>
          <button
            v-if="equippedArmors.length > 0 && editable"
            type="button"
            class="btn btn-ghost btn-xs uppercase tracking-wide hover:border-error/45 hover:bg-error/10"
            :disabled="busy"
            @click="onUnequipAllArmors"
          >
            Tout retirer
          </button>
        </div>
      </div>

      <div
        v-else-if="isWeaponSlot && equippedWeaponOnSlot"
        class="mx-4 mt-3.5 flex flex-col gap-3 border border-accent/35 bg-base-100 px-3.5 py-3 sm:mx-5"
      >
        <div class="flex min-w-0 items-start gap-3">
          <span
            class="inline-flex size-7 shrink-0 items-center justify-center border border-base-content/15 bg-base-200/70 text-accent"
            aria-hidden="true"
          >
            <Sword class="h-4 w-4" />
          </span>
          <div class="flex min-w-0 flex-col gap-0.5">
            <p class="m-0 text-[0.62rem] font-bold uppercase tracking-wider opacity-55">Équipée</p>
            <p class="m-0 truncate text-[0.95rem] font-bold leading-tight" :title="equippedWeaponOnSlot.name">
              {{ equippedWeaponOnSlot.name }}
            </p>
            <p class="mt-1 flex flex-wrap gap-x-2.5 gap-y-1 text-[0.7rem] font-semibold opacity-70">
              <span v-if="equippedWeaponOnSlot.damageFormula" class="font-extrabold text-accent opacity-100">
                {{ equippedWeaponOnSlot.damageFormula }}
              </span>
              <span>Enc. {{ equippedWeaponOnSlot.encumbrance }}</span>
              <span>{{ qualityLabel(equippedWeaponOnSlot.quality) }}</span>
              <span>{{ weaponHandsLabel(equippedWeaponOnSlot) }}</span>
            </p>
          </div>
        </div>

        <div
          v-if="editable"
          class="flex justify-end border-t border-base-content/10 pt-2"
        >
          <button
            type="button"
            class="btn btn-ghost btn-xs uppercase tracking-wide hover:border-error/45 hover:bg-error/10"
            :disabled="busy"
            @click="onUnequipWeapon"
          >
            Retirer
          </button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 sm:px-5">
        <template v-if="isArmorSlot">
          <p v-if="filteredArmors.length === 0" class="my-1.5 text-sm opacity-65">
            Aucune armure de l’inventaire ne couvre cette zone.
          </p>

          <template v-else>
            <section v-if="equippedArmors.length > 0" class="space-y-2">
              <h4 class="m-0 flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] opacity-60">
                Équipé
              </h4>
              <div class="flex flex-col gap-2">
                <button
                  v-for="(armor, index) in equippedArmors"
                  :key="armor.id"
                  type="button"
                  class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2.5 border border-accent/40 bg-base-100 px-3 py-2.5 text-left transition hover:-translate-y-px hover:border-accent/50 hover:shadow-sm disabled:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                  :disabled="!editable || busy"
                  @click="onSelectArmor(armor)"
                >
                  <span
                    class="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center border border-accent/65 bg-accent text-[0.72rem] font-extrabold tabular-nums text-accent-content"
                    aria-hidden="true"
                  >
                    {{ index + 1 }}
                  </span>
                  <span class="flex min-w-0 flex-col gap-1">
                    <span class="text-[0.92rem] font-bold leading-tight">{{ armor.name }}</span>
                    <span
                      v-if="armor.description"
                      class="line-clamp-2 text-[0.72rem] leading-snug opacity-60"
                    >
                      {{ armor.description }}
                    </span>
                    <span class="mt-0.5 flex flex-wrap gap-x-3 gap-y-1.5">
                      <span class="inline-flex items-center gap-1 text-[0.7rem] font-extrabold text-accent">
                        <Shield class="h-3 w-3" aria-hidden="true" />
                        {{ armor.armorPoints }} PA
                      </span>
                      <span class="inline-flex items-center gap-1 text-[0.7rem] font-semibold opacity-70">
                        <Weight class="h-3 w-3" aria-hidden="true" />
                        Enc. {{ armor.encumbrance }}
                      </span>
                      <span class="text-[0.7rem] font-semibold opacity-70">
                        {{ qualityLabel(armor.quality) }}
                      </span>
                      <span
                        v-if="armor.coveredLocations?.length"
                        class="text-[0.7rem] italic opacity-55"
                      >
                        {{ armor.coveredLocations.join(' · ') }}
                      </span>
                    </span>
                  </span>
                  <span
                    v-if="editable"
                    class="self-center text-[0.65rem] font-extrabold uppercase tracking-wider opacity-55"
                  >
                    Retirer
                  </span>
                </button>
              </div>
            </section>

            <section
              class="space-y-2"
              :class="{ 'mt-4 border-t border-base-content/10 pt-3.5': equippedArmors.length > 0 }"
            >
              <h4 class="m-0 flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] opacity-60">
                Inventaire
                <span
                  class="inline-flex h-4 min-w-4 items-center justify-center border border-base-content/15 px-1 text-[0.62rem] font-extrabold tabular-nums"
                >
                  {{ inventoryArmors.length }}
                </span>
              </h4>

              <p v-if="inventoryArmors.length === 0" class="my-1.5 text-[0.78rem] opacity-65">
                Aucune autre pièce disponible pour cette zone.
              </p>

              <div v-else class="flex flex-col gap-2">
                <button
                  v-for="armor in inventoryArmors"
                  :key="armor.id"
                  type="button"
                  class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2.5 border border-base-content/15 bg-base-100 px-3 py-2.5 text-left transition hover:-translate-y-px hover:border-accent/50 hover:shadow-sm disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none cursor-pointer"
                  :disabled="!editable || busy || isArmorBlocked(armor)"
                  :title="
                    isArmorBlocked(armor)
                      ? `Maximum ${MAX_ARMORS_PER_LOCATION} couches atteint`
                      : undefined
                  "
                  @click="onSelectArmor(armor)"
                >
                  <span
                    class="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center border border-base-content/15 bg-base-200/70 text-accent"
                    aria-hidden="true"
                  >
                    <Lock v-if="isArmorBlocked(armor)" class="h-4 w-4" />
                    <Shield v-else class="h-4 w-4" />
                  </span>
                  <span class="flex min-w-0 flex-col gap-1">
                    <span class="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-1">
                      <span class="text-[0.92rem] font-bold leading-tight">{{ armor.name }}</span>
                      <span
                        v-if="isArmorBlocked(armor)"
                        class="text-[0.62rem] font-extrabold uppercase tracking-wide text-warning"
                      >
                        Zone pleine
                      </span>
                    </span>
                    <span
                      v-if="armor.description"
                      class="line-clamp-2 text-[0.72rem] leading-snug opacity-60"
                    >
                      {{ armor.description }}
                    </span>
                    <span class="mt-0.5 flex flex-wrap gap-x-3 gap-y-1.5">
                      <span class="inline-flex items-center gap-1 text-[0.7rem] font-extrabold text-accent">
                        <Shield class="h-3 w-3" aria-hidden="true" />
                        {{ armor.armorPoints }} PA
                      </span>
                      <span class="inline-flex items-center gap-1 text-[0.7rem] font-semibold opacity-70">
                        <Weight class="h-3 w-3" aria-hidden="true" />
                        Enc. {{ armor.encumbrance }}
                      </span>
                      <span class="text-[0.7rem] font-semibold opacity-70">
                        {{ qualityLabel(armor.quality) }}
                      </span>
                      <span
                        v-if="armor.coveredLocations?.length"
                        class="text-[0.7rem] italic opacity-55"
                      >
                        {{ armor.coveredLocations.join(' · ') }}
                      </span>
                    </span>
                  </span>
                  <span
                    v-if="editable"
                    class="self-center text-[0.65rem] font-extrabold uppercase tracking-wider opacity-55"
                  >
                    {{ armorActionLabel(armor) }}
                  </span>
                </button>
              </div>
            </section>
          </template>
        </template>

        <template v-else-if="isWeaponSlot">
          <p v-if="filteredWeapons.length === 0" class="my-1.5 text-sm opacity-65">
            Aucune arme dans l’inventaire.
          </p>

          <template v-else>
            <section class="space-y-2">
              <h4 class="m-0 flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] opacity-60">
                {{ equippedWeaponOnSlot ? 'Autres armes' : 'Armes' }}
                <span
                  class="inline-flex h-4 min-w-4 items-center justify-center border border-base-content/15 px-1 text-[0.62rem] font-extrabold tabular-nums"
                >
                  {{ availableWeapons.length }}
                </span>
              </h4>

              <p v-if="availableWeapons.length === 0" class="my-1.5 text-[0.78rem] opacity-65">
                Aucune autre arme à équiper.
              </p>

              <div v-else class="flex flex-col gap-2">
                <article
                  v-for="row in availableWeapons"
                  :key="row.weapon.id"
                  class="flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2.5 border border-base-content/15 bg-base-100 px-3 py-2.5"
                >
                  <div class="min-w-0 flex-1 basis-48">
                    <div class="flex min-w-0 items-center gap-2">
                      <Sword class="h-3.5 w-3.5 shrink-0 text-accent opacity-85" aria-hidden="true" />
                      <p class="m-0 min-w-0 flex-1 truncate text-[0.88rem] font-bold leading-tight" :title="row.weapon.name">
                        {{ row.weapon.name }}
                      </p>
                    </div>
                    <p class="ml-5 mt-1 flex flex-wrap gap-x-2.5 gap-y-1 text-[0.7rem] font-semibold opacity-70">
                      <span v-if="row.weapon.damageFormula" class="font-extrabold text-accent opacity-100">
                        {{ row.weapon.damageFormula }}
                      </span>
                      <span>Enc. {{ row.weapon.encumbrance }}</span>
                      <span>{{ qualityLabel(row.weapon.quality) }}</span>
                      <span>{{ row.handsLabel }}</span>
                    </p>
                    <p
                      v-if="row.locationHint"
                      class="ml-5 mt-1 text-[0.62rem] font-bold uppercase tracking-wider opacity-50"
                    >
                      {{ row.locationHint }}
                    </p>
                  </div>

                  <div v-if="editable" class="ml-auto flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      class="btn btn-sm border-accent/40 bg-accent/15"
                      :disabled="busy || !targetHand"
                      @click="onSelectWeapon(row.weapon)"
                    >
                      {{ row.primaryLabel }}
                    </button>
                  </div>
                </article>
              </div>
            </section>
          </template>
        </template>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button type="submit" aria-label="Fermer">close</button>
    </form>
  </dialog>
</template>
