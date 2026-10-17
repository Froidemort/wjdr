import Graph from 'graphology'
import { bidirectional } from 'graphology-shortest-path/unweighted'
import { graphlib, layout } from '@dagrejs/dagre'
import type { CareerPathCareer } from '../types/career'
import type { CareerPathRow } from '../types/db'

export type CareerGraphMode = 'chemin' | 'vers' | 'depuis'

export interface CareerGraphEdge {
  id: string
  source: string
  target: string
}

export interface CareerSubgraph {
  nodeIds: string[]
  edges: CareerGraphEdge[]
}

export interface PositionedNode {
  id: string
  x: number
  y: number
}

export const NODE_WIDTH = 160
export const NODE_HEIGHT = 56
export const MAX_SHORTEST_PATHS = 50

const EMPTY_SUBGRAPH: CareerSubgraph = { nodeIds: [], edges: [] }

function edgeId(source: string, target: string): string {
  return `${source}->${target}`
}

function toSubgraph(nodeIds: Set<string>, edgeKeys: Map<string, CareerGraphEdge>): CareerSubgraph {
  return { nodeIds: [...nodeIds], edges: [...edgeKeys.values()] }
}

export function buildCareerGraph(careers: CareerPathCareer[], paths: CareerPathRow[]): Graph {
  const graph = new Graph({ multi: false, type: 'directed' })

  for (const career of careers) {
    if (!graph.hasNode(career.id)) graph.addNode(career.id)
  }
  for (const path of paths) {
    if (
      graph.hasNode(path.from_career_id) &&
      graph.hasNode(path.to_career_id) &&
      !graph.hasEdge(path.from_career_id, path.to_career_id)
    ) {
      graph.addEdge(path.from_career_id, path.to_career_id)
    }
  }

  return graph
}

// All shortest paths (by hop count), capped to avoid combinatorial blow-up.
export function findShortestPaths(
  graph: Graph,
  start: string,
  end: string,
  maxPaths = MAX_SHORTEST_PATHS
): string[][] {
  if (!graph.hasNode(start) || !graph.hasNode(end)) return []
  if (start === end) return [[start]]

  const shortest = bidirectional(graph, start, end)
  if (!shortest || shortest.length === 0) return []

  const maxLength = shortest.length
  const found: string[][] = []
  const current: string[] = [start]

  const visit = (node: string): void => {
    if (found.length >= maxPaths) return
    if (node === end) {
      found.push([...current])
      return
    }
    if (current.length >= maxLength) return

    for (const neighbor of graph.outboundNeighbors(node)) {
      if (current.includes(neighbor)) continue
      current.push(neighbor)
      visit(neighbor)
      current.pop()
      if (found.length >= maxPaths) return
    }
  }

  visit(start)
  return found
}

export function buildPathSubgraph(
  graph: Graph,
  start: string,
  end: string,
  maxPaths = MAX_SHORTEST_PATHS
): CareerSubgraph {
  const paths = findShortestPaths(graph, start, end, maxPaths)
  if (paths.length === 0) return EMPTY_SUBGRAPH

  const nodeIds = new Set<string>()
  const edges = new Map<string, CareerGraphEdge>()
  for (const path of paths) {
    path.forEach((id, index) => {
      nodeIds.add(id)
      const next = path[index + 1]
      if (next) {
        const id2 = edgeId(id, next)
        edges.set(id2, { id: id2, source: id, target: next })
      }
    })
  }
  return toSubgraph(nodeIds, edges)
}

export function buildTowardSubgraph(graph: Graph, targetId: string): CareerSubgraph {
  if (!graph.hasNode(targetId)) return EMPTY_SUBGRAPH

  const nodeIds = new Set<string>([targetId])
  const edges = new Map<string, CareerGraphEdge>()
  for (const source of graph.inboundNeighbors(targetId)) {
    nodeIds.add(source)
    const id = edgeId(source, targetId)
    edges.set(id, { id, source, target: targetId })
  }
  return toSubgraph(nodeIds, edges)
}

export function buildFromSubgraph(graph: Graph, sourceId: string): CareerSubgraph {
  if (!graph.hasNode(sourceId)) return EMPTY_SUBGRAPH

  const nodeIds = new Set<string>([sourceId])
  const edges = new Map<string, CareerGraphEdge>()
  for (const target of graph.outboundNeighbors(sourceId)) {
    nodeIds.add(target)
    const id = edgeId(sourceId, target)
    edges.set(id, { id, source: sourceId, target })
  }
  return toSubgraph(nodeIds, edges)
}

export function predecessorsOf(graph: Graph, careerId: string): string[] {
  return graph.hasNode(careerId) ? graph.inboundNeighbors(careerId) : []
}

export function successorsOf(graph: Graph, careerId: string): string[] {
  return graph.hasNode(careerId) ? graph.outboundNeighbors(careerId) : []
}

export function layoutSubgraph(subgraph: CareerSubgraph): PositionedNode[] {
  const dagreGraph = new graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 70 })

  for (const id of subgraph.nodeIds) {
    dagreGraph.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of subgraph.edges) {
    dagreGraph.setEdge(edge.source, edge.target)
  }

  layout(dagreGraph)

  return subgraph.nodeIds.map((id) => {
    const position = dagreGraph.node(id)
    return {
      id,
      x: position ? position.x - NODE_WIDTH / 2 : 0,
      y: position ? position.y - NODE_HEIGHT / 2 : 0,
    }
  })
}
