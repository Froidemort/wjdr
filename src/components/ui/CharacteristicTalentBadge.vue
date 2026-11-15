<script setup lang="ts">
import { Sparkles } from '@lucide/vue'
import { onClickOutside, useElementHover, useMediaQuery } from '@vueuse/core'
import { computed, ref, useId, watch } from 'vue'
import type { LinkedTalentDetail } from '../../utils/characterTalentReminders'

const props = defineProps<{
  statCode: string
  talents: LinkedTalentDetail[]
}>()

const root = ref<HTMLElement | null>(null)
const open = ref(false)
const dismissed = ref(false)
const hovered = useElementHover(root)
// Hover only where a pointer exists (desktop/tablet with mouse); touch devices use click.
const canHover = useMediaQuery('(hover: hover) and (min-width: 768px)')
const panelId = useId()
const isVisible = computed(() => open.value || (canHover.value && hovered.value && !dismissed.value))
const label = computed(() =>
  props.talents.length > 1
    ? `${props.talents.length} talents liés à ${props.statCode}`
    : `1 talent lié à ${props.statCode}`
)

watch(hovered, (value) => {
  if (!value) dismissed.value = false
})

onClickOutside(root, () => {
  open.value = false
})

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    open.value = false
    dismissed.value = true
  }
}

function onToggle(): void {
  dismissed.value = false
  open.value = !open.value
}
</script>

<template>
  <!-- On touch, `contents` lets the in-flow panel wrap onto its own full-width row of the header. -->
  <div ref="root" class="relative" :class="{ contents: !canHover }" @click.stop @keydown="onKeydown">
    <button
      type="button"
      class="btn btn-sm btn-soft min-h-11 min-w-11 gap-1 px-2 normal-case"
      :aria-label="label"
      :aria-expanded="isVisible"
      :aria-controls="panelId"
      data-testid="characteristic-talent-badge"
      @click="onToggle"
    >
      <Sparkles class="size-4" aria-hidden="true" />
      <span aria-hidden="true">{{ talents.length }}</span>
    </button>
    <div
      v-show="isVisible"
      :id="panelId"
      role="group"
      :aria-label="`Talents liés à ${statCode}`"
      :class="canHover ? 'absolute right-0 top-full z-20 mt-1 w-72 max-w-[calc(100vw-2rem)]' : 'mt-2 w-full basis-full'"
    >
      <div class="rounded-box border border-base-300 bg-base-100 p-3 text-left shadow-lg">
        <ul class="max-h-72 space-y-3 overflow-y-auto overscroll-contain">
          <li v-for="talent in talents" :key="talent.id">
            <p class="break-words font-semibold">{{ talent.name }}</p>
            <p class="whitespace-pre-line break-words text-sm opacity-80">{{ talent.description || 'Aucune description disponible.' }}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
