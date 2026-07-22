<script setup lang="ts">
import { BanknoteArrowDown, Coins } from '@lucide/vue'
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    gold: number
    silver: number
    copper: number
    editable?: boolean
  }>(),
  {
    editable: false,
  }
)

const emit = defineEmits<{
  (event: 'update:gold', value: number): void
  (event: 'update:silver', value: number): void
  (event: 'update:copper', value: number): void
  (event: 'commit'): void
  (event: 'subtract', value: { silver: number; copper: number }): void
}>()

const subtractDialogRef = ref<HTMLDialogElement | null>(null)
const subtractSilver = ref(0)
const subtractCopper = ref(0)

function parseNonNegativeInteger(value: string): number {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, parsed)
}

function onGoldInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:gold', parseNonNegativeInteger(target.value))
}

function onSilverInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:silver', parseNonNegativeInteger(target.value))
}

function onCopperInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:copper', parseNonNegativeInteger(target.value))
}

function onMoneyFieldBlur(): void {
  emit('commit')
}

function openSubtractDialog(): void {
  resetSubtractForm()
  subtractDialogRef.value?.showModal()
}

function resetSubtractForm(): void {
  subtractSilver.value = 0
  subtractCopper.value = 0
}

function closeSubtractDialog(): void {
  if (subtractDialogRef.value?.open) {
    subtractDialogRef.value.close()
  }
}

function onSubtractDialogClosed(): void {
  resetSubtractForm()
}

function confirmSubtract(): void {
  emit('subtract', {
    silver: Math.max(0, Math.floor(subtractSilver.value)),
    copper: Math.max(0, Math.floor(subtractCopper.value)),
  })

  closeSubtractDialog()
}
</script>

<template>
  <article class="card border border-base-300 bg-base-100">
    <div class="card-body p-4 gap-4">
      <div class="flex items-center justify-between">
        <div class="tooltip" data-tip="Monnaie">
          <Coins class="text-accent h-6 w-6" />
        </div>
        <button
          v-if="editable"
          type="button"
          class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11 text-error"
          aria-label="Soustraire de l'argent"
          @click="openSubtractDialog"
        >
          <BanknoteArrowDown class="h-6 w-6" />
        </button>
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3 tabular-nums">
        <div class="money-slot money-slot-gold rounded-box border border-base-300 p-2 text-center">
          <template v-if="editable">
            <input
              :value="gold"
              type="number"
              min="0"
              class="input input-sm h-11 w-full border-base-300 bg-base-100 text-center text-2xl font-black font-warhammer [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Couronnes d or"
              @input="onGoldInput"
              @blur="onMoneyFieldBlur"
            />
          </template>
          <template v-else>
            <div class="text-3xl font-black leading-none font-warhammer">{{ gold }}</div>
          </template>
          <div class="text-xs font-semibold opacity-80">CO</div>
        </div>

        <div class="money-slot money-slot-silver rounded-box border border-base-300 p-2 text-center">
          <template v-if="editable">
            <input
              :value="silver"
              type="number"
              min="0"
              class="input input-sm h-11 w-full border-base-300 bg-base-100 text-center text-2xl font-black font-warhammer [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Pistoles d argent"
              @input="onSilverInput"
              @blur="onMoneyFieldBlur"
            />
          </template>
          <template v-else>
            <div class="text-3xl font-black leading-none font-warhammer">{{ silver }}</div>
          </template>
          <div class="text-xs font-semibold opacity-80">PA</div>
        </div>

        <div class="money-slot money-slot-copper rounded-box border border-base-300 p-2 text-center">
          <template v-if="editable">
            <input
              :value="copper"
              type="number"
              min="0"
              class="input input-sm h-11 w-full border-base-300 bg-base-100 text-center text-2xl font-black font-warhammer [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Sous de cuivre"
              @input="onCopperInput"
              @blur="onMoneyFieldBlur"
            />
          </template>
          <template v-else>
            <div class="text-3xl font-black leading-none font-warhammer">{{ copper }}</div>
          </template>
          <div class="text-xs font-semibold opacity-80">S</div>
        </div>
      </div>
    </div>
  </article>

  <dialog ref="subtractDialogRef" class="modal modal-top sm:modal-middle" @close="onSubtractDialogClosed">
    <div class="modal-box grim-modal-box p-5 max-w-md">
      <h3 class="grim-modal-title text-2xl text-center">Soustraire de l'argent</h3>

      <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="fieldset">
          <span class="fieldset-legend">Pistoles (PA)</span>
          <input
            v-model.number="subtractSilver"
            type="number"
            min="0"
            class="input input-sm"
            aria-label="Pistoles à soustraire"
          />
        </label>

        <label class="fieldset">
          <span class="fieldset-legend">Sous (S)</span>
          <input
            v-model.number="subtractCopper"
            type="number"
            min="0"
            class="input input-sm"
            aria-label="Sous à soustraire"
          />
        </label>
      </div>

      <div class="grim-modal-actions mt-5 flex items-center justify-end gap-2">
        <button type="button" class="btn btn-sm btn-ghost" @click="closeSubtractDialog">Annuler</button>
        <button type="button" class="btn btn-sm" @click="confirmSubtract">Soustraire</button>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>Fermer</button>
    </form>
  </dialog>
</template>
