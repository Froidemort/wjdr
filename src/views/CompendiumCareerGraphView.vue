<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { MarkerType, VueFlow, useVueFlow } from '@vue-flow/core'
import type { Edge, Node, NodeMouseEvent } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { storeToRefs } from 'pinia'
import { RotateCcw } from '@lucide/vue'
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  buildCareerGraph,
  buildFromSubgraph,
  buildPathSubgraph,
  buildTowardSubgraph,
  layoutSubgraph,
  predecessorsOf,
  successorsOf,
} from '../composables/useCareerGraph'
import type { CareerGraphMode, CareerSubgraph } from '../composables/useCareerGraph'
import { useCareerGraphStore } from '../stores/careerGraph'

const MODES: { value: CareerGraphMode; label: string }[] = [
  { value: 'chemin', label: 'Chemin' },
  { value: 'vers', label: 'Vers' },
  { value: 'depuis', label: 'Depuis' },
]

const store = useCareerGraphStore()
const { careers, paths, loading, loaded, error } = storeToRefs(store)
const { fitView } = useVueFlow()

const mode = ref<CareerGraphMode>('chemin')
const selectedStart = ref('')
const selectedEnd = ref('')
const selectedNodeId = ref<string | null>(null)

const graph = computed(() => buildCareerGraph(careers.value, paths.value))
const careerNames = computed(() => new Map(careers.value.map((career) => [career.id, career.name])))

const needsStart = computed(() => mode.value !== 'vers')
const needsEnd = computed(() => mode.value !== 'depuis')

const subgraph = computed<CareerSubgraph>(() => {
  const start = selectedStart.value
  const end = selectedEnd.value
  if (mode.value === 'chemin') return start && end ? buildPathSubgraph(graph.value, start, end) : { nodeIds: [], edges: [] }
  if (mode.value === 'vers') return end ? buildTowardSubgraph(graph.value, end) : { nodeIds: [], edges: [] }
  return start ? buildFromSubgraph(graph.value, start) : { nodeIds: [], edges: [] }
})

const hasSelection = computed(() => {
  if (mode.value === 'chemin') return Boolean(selectedStart.value && selectedEnd.value)
  return mode.value === 'vers' ? Boolean(selectedEnd.value) : Boolean(selectedStart.value)
})

const noPathFound = computed(() => mode.value === 'chemin' && hasSelection.value && subgraph.value.nodeIds.length === 0)

const nodes = computed<Node[]>(() =>
  layoutSubgraph(subgraph.value).map((node) => ({
    id: node.id,
    type: 'career',
    data: { label: careerNames.value.get(node.id) ?? node.id },
    position: { x: node.x, y: node.y },
    draggable: false,
    connectable: false,
  }))
)

const edges = computed<Edge[]>(() =>
  subgraph.value.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: mode.value === 'chemin',
    style: { stroke: 'var(--color-accent)', strokeWidth: mode.value === 'chemin' ? 4 : 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-accent)' },
  }))
)

const selectedCareerName = computed(() => (selectedNodeId.value ? (careerNames.value.get(selectedNodeId.value) ?? '') : ''))
const predecessors = computed(() => namesOf(selectedNodeId.value ? predecessorsOf(graph.value, selectedNodeId.value) : []))
const successors = computed(() => namesOf(selectedNodeId.value ? successorsOf(graph.value, selectedNodeId.value) : []))

function namesOf(ids: string[]): string[] {
  return ids
    .map((id) => careerNames.value.get(id))
    .filter((name): name is string => Boolean(name))
    .sort((left, right) => left.localeCompare(right, 'fr', { sensitivity: 'base' }))
}

function resetSelection(): void {
  selectedStart.value = ''
  selectedEnd.value = ''
  selectedNodeId.value = null
}

function onNodeClick({ node }: NodeMouseEvent): void {
  selectedNodeId.value = node.id
}

watch(subgraph, async () => {
  await nextTick()
  await fitView({ padding: 0.2, duration: 400 })
})

onMounted(() => {
  void store.load()
})
</script>

<template>
  <section class="bg-base-100">
    <header class="bg-base-300 text-base-content p-6">
      <h1 class="text-2xl font-bold">Compendium des carrières</h1>
      <p class="opacity-80 text-sm mt-1">Explore les évolutions possibles d'une carrière à l'autre.</p>
    </header>

    <div class="p-4 flex flex-col gap-4">
      <div v-if="loading && !loaded" class="flex flex-col gap-3" aria-busy="true">
        <div class="skeleton h-11 w-full sm:w-64"></div>
        <div class="skeleton h-[60dvh] min-h-80 w-full"></div>
      </div>

      <div v-else-if="error" role="alert" class="alert alert-error alert-soft">
        <span>{{ error }}</span>
        <button type="button" class="btn btn-sm min-h-11" @click="store.load(true)">Réessayer</button>
      </div>

      <p v-else-if="careers.length === 0" class="text-sm opacity-70">Aucune carrière disponible pour le moment.</p>

      <template v-else>
        <div class="border border-base-300 bg-base-200 rounded-box shadow-md p-4 flex flex-col gap-4">
          <div class="join self-start" role="group" aria-label="Mode d'affichage">
            <button
              v-for="option in MODES"
              :key="option.value"
              type="button"
              class="btn join-item min-h-11"
              :class="mode === option.value ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="mode === option.value"
              @click="mode = option.value"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <fieldset v-if="needsStart" class="fieldset">
              <legend class="fieldset-legend">Départ</legend>
              <select v-model="selectedStart" class="select w-full sm:w-auto" aria-label="Carrière de départ">
                <option value="">Choisir une carrière</option>
                <option v-for="career in careers" :key="career.id" :value="career.id">{{ career.name }}</option>
              </select>
            </fieldset>

            <fieldset v-if="needsEnd" class="fieldset">
              <legend class="fieldset-legend">Arrivée</legend>
              <select v-model="selectedEnd" class="select w-full sm:w-auto" aria-label="Carrière d'arrivée">
                <option value="">Choisir une carrière</option>
                <option v-for="career in careers" :key="career.id" :value="career.id">{{ career.name }}</option>
              </select>
            </fieldset>

            <button type="button" class="btn btn-outline min-h-11 gap-2" @click="resetSelection">
              <RotateCcw class="size-4" />
              Réinitialiser
            </button>
          </div>

          <p v-if="noPathFound" role="alert" class="alert alert-warning alert-soft">
            Aucun chemin possible entre ces deux carrières.
          </p>
        </div>

        <div class="relative h-[60dvh] min-h-80 rounded-box border border-base-300 bg-base-100 overflow-hidden">
          <VueFlow
            :nodes="nodes"
            :edges="edges"
            :min-zoom="0.2"
            :max-zoom="2"
            :nodes-draggable="false"
            :nodes-connectable="false"
            :elements-selectable="false"
            aria-label="Graphe des carrières"
            @node-click="onNodeClick"
          >
            <template #node-career="{ data }">
              <button
                type="button"
                class="card card-border bg-base-100 hover:border-primary flex items-center justify-center p-2 text-center text-sm font-bold cursor-pointer transition-colors"
                :style="{ width: `${NODE_WIDTH}px`, height: `${NODE_HEIGHT}px` }"
                :aria-label="`Voir la carrière ${data.label}`"
              >
                {{ data.label }}
              </button>
            </template>

            <Background pattern-color="var(--color-base-content)" :gap="20" />
            <Controls class="text-base-content" />
          </VueFlow>

          <p
            v-if="nodes.length === 0 && !noPathFound"
            class="absolute inset-0 flex items-center justify-center p-6 text-center text-sm opacity-70 pointer-events-none"
          >
            Choisis une carrière pour afficher le graphe.
          </p>
        </div>

        <div v-if="selectedNodeId" class="card card-border bg-base-200 shadow-md">
          <div class="card-body gap-3">
            <div class="flex items-start justify-between gap-2">
              <h2 class="card-title">{{ selectedCareerName }}</h2>
              <button type="button" class="btn btn-ghost btn-sm min-h-11" @click="selectedNodeId = null">Fermer</button>
            </div>
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wide opacity-70">Antécédents</h3>
              <p class="text-sm">{{ predecessors.length > 0 ? predecessors.join(', ') : 'Aucun' }}</p>
            </div>
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wide opacity-70">Débouchés</h3>
              <p class="text-sm">{{ successors.length > 0 ? successors.join(', ') : 'Aucun' }}</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
