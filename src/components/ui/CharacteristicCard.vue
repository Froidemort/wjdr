<script setup lang="ts">
import { ChevronUp } from '@lucide/vue'
import { computed } from 'vue'
import type { CharacterStatValue } from '../../types/domain'

const props = withDefaults(
  defineProps<{
    stat: CharacterStatValue
    editable?: boolean
    expanded?: boolean
  }>(),
  {
    editable: false,
    expanded: false,
  }
)

const emit = defineEmits<{
  (event: 'toggle'): void
  (event: 'tick-up', value: { statCode: string; step: number }): void
  (event: 'tick-down', value: { statCode: string; step: number }): void
  (event: 'update-base', value: { statCode: string; baseValue: number }): void
  (event: 'update-total-advanced', value: { statCode: string; totalAdvanced: number }): void
}>()

const tickStep = computed(() => (props.stat.isSecondary ? 1 : 5))
const totalValue = computed(() => Math.max(0, props.stat.baseValue + props.stat.currentAdvanced))
const cardToneClass = computed(() =>
  props.stat.isSecondary ? 'bg-base-100 border-base-300' : 'bg-base-200 border-base-300'
)
const totalToneClass = computed(() => (props.stat.isSecondary ? 'bg-base-200' : 'bg-base-300'))

function onTickUp(): void {
  if (!props.editable) {
    return
  }

  emit('tick-up', { statCode: props.stat.statCode, step: tickStep.value })
}

function onTickDown(): void {
  if (!props.editable) {
    return
  }

  emit('tick-down', { statCode: props.stat.statCode, step: tickStep.value })
}

function onBaseInput(event: Event): void {
  if (!props.editable) {
    return
  }

  const target = event.target as HTMLInputElement
  emit('update-base', {
    statCode: props.stat.statCode,
    baseValue: Math.max(0, Number(target.value || 0)),
  })
}

function onTotalAdvancedInput(event: Event): void {
  if (!props.editable) {
    return
  }

  const target = event.target as HTMLInputElement
  emit('update-total-advanced', {
    statCode: props.stat.statCode,
    totalAdvanced: Math.max(0, Number(target.value || 0)),
  })
}

// Clicks on the card body collapse it, except on its own controls.
function onCardClick(event: MouseEvent): void {
  if ((event.target as HTMLElement).closest('button, input, label')) {
    return
  }

  emit('toggle')
}
</script>

<template>
  <button
    v-if="!expanded"
    type="button"
    class="min-h-11 w-full rounded-box border px-2 py-1 text-center"
    :class="cardToneClass"
    aria-expanded="false"
    @click="emit('toggle')"
  >
    <span class="block text-xs font-semibold uppercase opacity-75">{{ stat.statCode }}</span>
    <span class="block text-lg font-black tabular-nums">{{ totalValue }}</span>
    <span class="sr-only">Afficher le détail</span>
  </button>
  <article v-else class="card border w-full" :class="cardToneClass" @click="onCardClick">
    <div class="card-body p-4 gap-3">
      <h4 class="text-center">
        <button
          type="button"
          class="flex min-h-11 w-full items-center justify-center gap-2 text-2xl font-black leading-none"
          aria-expanded="true"
          @click="emit('toggle')"
        >
          {{ stat.statCode }}
          <ChevronUp class="size-4 opacity-70" aria-hidden="true" />
        </button>
      </h4>

      <div class="rounded-box border border-base-300 p-3" :class="totalToneClass">
        <div class="text-sm font-semibold uppercase tracking-wide text-center opacity-80">Valeur totale</div>
        <div class="mt-0.5 text-[11px] text-center opacity-65">Base + avancement courant</div>
        <div class="text-4xl font-black leading-none tabular-nums text-center text-primary">{{ totalValue }}</div>
      </div>

      <div class="rounded-box border border-base-300 p-3">
        <div class="text-xs font-semibold uppercase tracking-wide text-center opacity-75">Avancement courant / total</div>
        <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div class="text-2xl font-extrabold tabular-nums flex items-center gap-2">
            <span>{{ stat.currentAdvanced }}</span>
            <span class="opacity-70">/</span>
            <template v-if="editable">
              <input
                :value="stat.totalAdvanced"
                type="number"
                min="0"
                class="input input-sm h-11 w-20 text-center text-2xl font-bold tabular-nums [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label="Valeur maximale d'avancement"
                @change="onTotalAdvancedInput"
              />
            </template>
            <span v-else>{{ stat.totalAdvanced }}</span>
          </div>
          <div v-if="editable" class="join items-stretch">
            <button class="btn btn-sm h-11 min-h-11 min-w-16 join-item px-3 text-base font-semibold" @click="onTickDown">-{{ tickStep }}<span class="sr-only">&nbsp;Diminuer l'avancement</span></button>
            <button class="btn btn-sm h-11 min-h-11 min-w-16 join-item px-3 text-base font-semibold" @click="onTickUp">+{{ tickStep }}<span class="sr-only">&nbsp;Augmenter l'avancement</span></button>
          </div>
        </div>
      </div>

      <div class="rounded-box border border-base-300 p-3">
        <div class="text-sm font-semibold uppercase tracking-wide text-center opacity-80">Valeur de base</div>
        <div class="mt-0.5 text-[11px] text-center opacity-65">Avant modificateurs et progression</div>
        <template v-if="editable">
          <input
            :value="stat.baseValue"
            type="number"
            min="0"
            class="input input-sm mt-2 h-11 w-full text-center text-2xl font-bold tabular-nums [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="Valeur de base"
            @change="onBaseInput"
          />
        </template>
        <div v-else class="mt-2 text-2xl font-bold tabular-nums text-center">{{ stat.baseValue }}</div>
      </div>
    </div>
  </article>
</template>
