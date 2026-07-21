<script setup lang="ts">
import { computed } from 'vue'
import type { CharacterStatValue } from '../../types/domain'

const props = withDefaults(defineProps<{
  stat: CharacterStatValue
  editable?: boolean
}>(), {
  editable: false
})

const emit = defineEmits<{
  (event: 'tick-up', value: { statCode: string; step: number }): void
  (event: 'tick-down', value: { statCode: string; step: number }): void
  (event: 'update-base', value: { statCode: string; baseValue: number }): void
  (event: 'update-total-advanced', value: { statCode: string; totalAdvanced: number }): void
}>()

const tickStep = computed(() => (props.stat.isSecondary ? 1 : 5))
const totalValue = computed(() => Math.max(0, props.stat.baseValue + props.stat.currentAdvanced))
const cardToneClass = computed(() => (props.stat.isSecondary ? 'bg-base-100 border-base-300' : 'bg-base-200 border-base-300'))
const totalToneClass = computed(() => (props.stat.isSecondary ? 'bg-base-200' : 'bg-base-300'))
const totalValueClass = computed(() => (props.stat.isSecondary ? 'text-secondary' : 'text-primary'))

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
    baseValue: Math.max(0, Number(target.value || 0))
  })
}

function onTotalAdvancedInput(event: Event): void {
  if (!props.editable) {
    return
  }

  const target = event.target as HTMLInputElement
  emit('update-total-advanced', {
    statCode: props.stat.statCode,
    totalAdvanced: Math.max(0, Number(target.value || 0))
  })
}
</script>

<template>
  <article class="card border w-full" :class="cardToneClass">
    <div class="card-body p-4 gap-3">
      <div class="flex flex-col items-center justify-center gap-1 text-center">
        <h4 class="text-2xl font-black leading-none">{{ stat.statCode }}</h4>
        <span class="badge badge-ghost text-xs">{{ stat.isSecondary ? 'Secondaire' : 'Principale' }}</span>
      </div>

      <div class="rounded-box border border-base-300 p-3" :class="totalToneClass">
        <div class="text-sm font-semibold uppercase tracking-wide text-center opacity-80">Total</div>
        <div class="text-4xl font-black leading-none tabular-nums text-center" :class="totalValueClass">{{ totalValue }}</div>
      </div>

      <div class="rounded-box border border-base-300 p-3">
        <div class="mt-2 flex items-center justify-between gap-2">
          <div class="text-2xl font-extrabold tabular-nums flex items-center gap-2">
            <span>{{ stat.currentAdvanced }}</span>
            <span class="opacity-60">/</span>
            <template v-if="editable">
              <input
                :value="stat.totalAdvanced"
                type="number"
                min="0"
                class="input input-sm h-10 w-20 text-center text-2xl font-bold tabular-nums [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label="Valeur maximale d'avancement"
                @change="onTotalAdvancedInput"
              />
            </template>
            <span v-else>{{ stat.totalAdvanced }}</span>
          </div>
          <div v-if="editable" class="join items-stretch">
            <button class="btn btn-sm h-10 min-h-10 min-w-14 join-item px-2 text-sm font-semibold" aria-label="Diminuer l'avancement" @click="onTickDown">-{{ tickStep }}</button>
            <button class="btn btn-sm h-10 min-h-10 min-w-14 join-item px-2 text-sm font-semibold" aria-label="Augmenter l'avancement" @click="onTickUp">+{{ tickStep }}</button>
          </div>
        </div>
      </div>

      <div class="rounded-box border border-base-300 p-3">
        <div class="text-sm font-semibold uppercase tracking-wide text-center opacity-80">Base</div>
        <template v-if="editable">
          <input
            :value="stat.baseValue"
            type="number"
            min="0"
            class="input input-sm mt-2 h-10 w-full text-center text-2xl font-bold tabular-nums [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="Valeur de base"
            @change="onBaseInput"
          />
        </template>
        <div v-else class="mt-2 text-2xl font-bold tabular-nums text-center">{{ stat.baseValue }}</div>
      </div>
    </div>
  </article>
</template>
