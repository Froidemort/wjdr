<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core'
import type { Node, Edge } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import dagre from '@dagrejs/dagre'
import Graph from 'graphology'
import { bidirectional } from 'graphology-shortest-path/astar'

import { supabase } from '../../db/supabase'

interface Career {
  id: string
  name: string
}

interface CareerPath {
  from_career_id: string
  to_career_id: string
}

type Mode = 'chemin' | 'vers' | 'depuis'

const careers = ref<Career[]>([])
const careerPaths = ref<CareerPath[]>([])
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

const mode = ref<Mode>('chemin')
const selectedStart = ref<string | null>(null)
const selectedEnd = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const clickedNodeId = ref<string | null>(null)

let graph = new Graph({ multi: false, type: 'directed' })
const { fitView, onNodeClick } = useVueFlow()

const getLayoutedElements = (inputNodes: Node[], inputEdges: Edge[]): { nodes: Node[], edges: Edge[] } => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 70 })

  inputNodes.forEach(node => dagreGraph.setNode(node.id, { width: 140, height: 50 }))
  inputEdges.forEach(edge => dagreGraph.setEdge(edge.source, edge.target))

  dagre.layout(dagreGraph)

  const layoutedNodes = inputNodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: { x: nodeWithPosition ? nodeWithPosition.x - 70 : 0, y: nodeWithPosition ? nodeWithPosition.y - 25 : 0 },
    }
  })

  return { nodes: layoutedNodes, edges: inputEdges }
}

const findAllShortestPaths = (start: string, end: string): string[][] => {
  const shortest = bidirectional(graph, start, end, () => 1)
  if (!shortest || shortest.length === 0) return []
  const minLength = shortest.length

  const allPaths: string[][] = []

  const dfs = (current: string, target: string, currentPath: string[]) => {
    if (currentPath.length > minLength) return
    if (current === target) {
      if (currentPath.length === minLength) {
        allPaths.push([...currentPath])
      }
      return
    }

    graph.forEachOutboundNeighbor(current, (neighbor) => {
      if (!currentPath.includes(neighbor)) {
        currentPath.push(neighbor)
        dfs(neighbor, target, currentPath)
        currentPath.pop()
      }
    })
  }

  dfs(start, end, [start])
  return allPaths
}

const updateGraphView = () => {
  errorMessage.value = null
  let activeNodeIds = new Set<string>()
  let activeEdgeIds = new Set<string>()

  if (mode.value === 'chemin') {
    if (!selectedStart.value || !selectedEnd.value) {
      nodes.value = []
      edges.value = []
      return
    }

    if (!graph.hasNode(selectedStart.value) || !graph.hasNode(selectedEnd.value)) {
      errorMessage.value = "Aucun chemin possible entre ces deux carrières !"
      nodes.value = []
      edges.value = []
      return
    }

    try {
      const allPaths = findAllShortestPaths(selectedStart.value, selectedEnd.value)

      if (allPaths.length === 0) {
        errorMessage.value = "Aucun chemin possible entre ces deux carrières !"
        nodes.value = []
        edges.value = []
        return
      }

      allPaths.forEach(pathNodes => {
        pathNodes.forEach(id => activeNodeIds.add(id))
        for (let i = 0; i < pathNodes.length - 1; i++) {
          activeEdgeIds.add(`${pathNodes[i]}->${pathNodes[i+1]}`)
        }
      })
    } catch {
      errorMessage.value = "Aucun chemin possible entre ces deux carrières !"
      nodes.value = []
      edges.value = []
      return
    }
  } else if (mode.value === 'vers') {
    if (!selectedEnd.value) {
      nodes.value = []
      edges.value = []
      return
    }

    if (!graph.hasNode(selectedEnd.value)) {
      errorMessage.value = "Carrière introuvable !"
      nodes.value = []
      edges.value = []
      return
    }

    const targetId = selectedEnd.value
    activeNodeIds.add(targetId)
    graph.forEachInboundNeighbor(targetId, (neighbor) => {
      activeNodeIds.add(neighbor)
      activeEdgeIds.add(`${neighbor}->${targetId}`)
    })
  } else if (mode.value === 'depuis') {
    if (!selectedStart.value) {
      nodes.value = []
      edges.value = []
      return
    }

    if (!graph.hasNode(selectedStart.value)) {
      errorMessage.value = "Carrière introuvable !"
      nodes.value = []
      edges.value = []
      return
    }

    const sourceId = selectedStart.value
    activeNodeIds.add(sourceId)
    graph.forEachOutboundNeighbor(sourceId, (neighbor) => {
      activeNodeIds.add(neighbor)
      activeEdgeIds.add(`${sourceId}->${neighbor}`)
    })
  }

  const subNodes: Node[] = careers.value
    .filter(c => activeNodeIds.has(c.id))
    .map(c => ({
      id: c.id,
      type: 'custom',
      data: { label: c.name },
      position: { x: 0, y: 0 }
    }))

  const subEdges: Edge[] = careerPaths.value
    .filter(p => activeEdgeIds.has(`${p.from_career_id}->${p.to_career_id}`))
    .map(p => {
      const edgeId = `${p.from_career_id}->${p.to_career_id}`
      const isPathHighlight = mode.value === 'chemin'
      return {
        id: edgeId,
        source: p.from_career_id,
        target: p.to_career_id,
        animated: isPathHighlight,
        style: {
          stroke: 'var(--color-accent)',
          strokeWidth: isPathHighlight ? 4 : 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'var(--color-accent)'
        }
      }
    })

  const layouted = getLayoutedElements(subNodes, subEdges)
  nodes.value = layouted.nodes
  edges.value = layouted.edges

  setTimeout(() => {
    fitView({
      padding: 0.2,
      duration: 800
    })
  }, 50)
}

const clickedCareerName = computed(() => {
  if (!clickedNodeId.value) return ''
  return careers.value.find(c => c.id === clickedNodeId.value)?.name || ''
})

const directPredecessors = computed<Career[]>(() => {
  if (!clickedNodeId.value || !graph.hasNode(clickedNodeId.value)) return []
  const neighborIds = graph.inboundNeighbors(clickedNodeId.value)
  return careers.value.filter(c => neighborIds.includes(c.id))
})

const directSuccessors = computed<Career[]>(() => {
  if (!clickedNodeId.value || !graph.hasNode(clickedNodeId.value)) return []
  const neighborIds = graph.outboundNeighbors(clickedNodeId.value)
  return careers.value.filter(c => neighborIds.includes(c.id))
})

watch([mode, selectedStart, selectedEnd], () => {
  updateGraphView()
})

onNodeClick(({ node }) => {
  clickedNodeId.value = node.id
})

onMounted(async () => {
  try {
    const { data: careersData, error: careersError } = await supabase
      .from('careers')
      .select('*')

    if (careersError) throw careersError

    const { data: pathsData, error: pathsError } = await supabase
      .from('career_paths')
      .select('*')
      .range(0, 999)

    if (pathsError) throw pathsError

    const { data: anotherPathsData, error: anotherPathsError } = await supabase
      .from('career_paths')
      .select('*')
      .range(1000, 1815)

    if (anotherPathsError) throw anotherPathsError

    careers.value = careersData || []
    careerPaths.value = [...(pathsData || []), ...(anotherPathsData || [])]

    graph = new Graph({ multi: false, type: 'directed' })
    careers.value.forEach(c => {
      if (!graph.hasNode(c.id)) {
        graph.addNode(c.id)
      }
    })
    careerPaths.value.forEach(p => {
      if (graph.hasNode(p.from_career_id) && graph.hasNode(p.to_career_id)) {
        if (!graph.hasEdge(p.from_career_id, p.to_career_id)) {
          graph.addEdge(p.from_career_id, p.to_career_id)
        }
      }
    })

    const gladiateur = careers.value.find(c => c.name.toLowerCase() === 'gladiateur')
    const champion = careers.value.find(c => c.name.toLowerCase() === 'champion')

    selectedStart.value = gladiateur ? gladiateur.id : (careers.value[0]?.id || null)
    selectedEnd.value = champion ? champion.id : (careers.value[1]?.id || null)
    mode.value = 'chemin'

    updateGraphView()

  } catch (error) {
    console.error('Erreur lors du chargement des carrières et des chemins :', error)
  }
})
</script>

<template>
  <div class="flex flex-col h-[600px] w-full bg-base-200 rounded-box p-4 gap-4 shadow-xl border border-base-300">
    
    <div class="flex flex-wrap gap-4 items-center bg-base-100 p-3 rounded-box shadow border border-base-300">
      
      <div class="join">
        <button 
          class="btn btn-sm join-item" 
          :class="mode === 'vers' ? 'btn-primary' : 'btn-ghost'"
          @click="mode = 'vers'">
          Vers
        </button>
        <button 
          class="btn btn-sm join-item" 
          :class="mode === 'depuis' ? 'btn-primary' : 'btn-ghost'"
          @click="mode = 'depuis'">
          Depuis
        </button>
        <button 
          class="btn btn-sm join-item" 
          :class="mode === 'chemin' ? 'btn-primary' : 'btn-ghost'"
          @click="mode = 'chemin'">
          Chemin
        </button>
      </div>

      <div class="form-control" v-if="mode === 'chemin' || mode === 'depuis'">
        <label class="label"><span class="label-text font-semibold">Départ</span></label>
        <select v-model="selectedStart" class="select select-bordered select-sm bg-base-200">
          <option :value="null">-- Choisir --</option>
          <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div class="form-control" v-if="mode === 'chemin' || mode === 'vers'">
        <label class="label"><span class="label-text font-semibold">Arrivée</span></label>
        <select v-model="selectedEnd" class="select select-bordered select-sm bg-base-200">
          <option :value="null">-- Choisir --</option>
          <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <button class="btn btn-sm btn-outline mt-6" @click="selectedStart = null; selectedEnd = null">
        Réinitialiser
      </button>

      <div v-if="errorMessage" class="alert alert-error py-1 px-3 text-sm mt-4 lg:mt-0 shadow-sm">
        <span>{{ errorMessage }}</span>
      </div>
    </div>

    <div v-if="clickedNodeId" class="bg-base-100 p-3 rounded-box shadow border border-base-300 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-sm">
      <div class="font-bold text-primary">
        Carrière sélectionnée : <span class="text-base-content underline">{{ clickedCareerName }}</span>
      </div>
      <div class="flex flex-wrap gap-6">
        <div>
          <span class="font-semibold text-base-content/70">Antécédents (Entrants) :</span>
          <span v-if="directPredecessors.length === 0" class="italic text-base-content/50 ml-1">Aucun</span>
          <span v-else class="ml-1">{{ directPredecessors.map(c => c.name).join(', ') }}</span>
        </div>
        <div>
          <span class="font-semibold text-base-content/70">Débouchés (Sortants) :</span>
          <span v-if="directSuccessors.length === 0" class="italic text-base-content/50 ml-1">Aucun</span>
          <span v-else class="ml-1">{{ directSuccessors.map(c => c.name).join(', ') }}</span>
        </div>
      </div>
      <button class="btn btn-xs btn-ghost" @click="clickedNodeId = null">Fermer</button>
    </div>

    <div class="flex-grow bg-base-100 rounded-box overflow-hidden border border-base-300 shadow-inner">
      <VueFlow :nodes="nodes"
      :edges="edges"
      :fit-view-on-init="true"
      :min-zoom="0.2"
      :max-zoom="2">
        
        <template #node-custom="{ data }">
          <div class="card bg-base-100 border border-primary/40 shadow-md p-3 text-center w-40 hover:border-primary transition-colors cursor-pointer">
            <span class="font-bold text-sm text-base-content">{{ data.label }}</span>
          </div>
        </template>

        <Background pattern-color="oklch(var(--bc) / 0.15)" :gap="20" />
        <Controls class="bg-base-100 border border-base-300 shadow-md rounded-box overflow-hidden text-base-content" />
      </VueFlow>
    </div>

  </div>
</template>

<style>
</style>