import { describe, expect, it } from 'vitest'
import {
  buildCareerGraph,
  buildFromSubgraph,
  buildPathSubgraph,
  buildTowardSubgraph,
  findShortestPaths,
  layoutSubgraph,
} from '../../src/composables/useCareerGraph'

const careers = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, name: id.toUpperCase() }))
const paths = [
  { from_career_id: 'a', to_career_id: 'b' },
  { from_career_id: 'a', to_career_id: 'c' },
  { from_career_id: 'b', to_career_id: 'd' },
  { from_career_id: 'c', to_career_id: 'd' },
  { from_career_id: 'a', to_career_id: 'b' },
  { from_career_id: 'x', to_career_id: 'a' },
]

describe('useCareerGraph', () => {
  const graph = buildCareerGraph(careers, paths)

  it('ignores duplicate and unknown edges', () => {
    expect(graph.order).toBe(5)
    expect(graph.size).toBe(4)
  })

  it('finds every shortest path', () => {
    expect(findShortestPaths(graph, 'a', 'd').sort()).toEqual([
      ['a', 'b', 'd'],
      ['a', 'c', 'd'],
    ])
    expect(findShortestPaths(graph, 'd', 'a')).toEqual([])
    expect(findShortestPaths(graph, 'a', 'a')).toEqual([['a']])
  })

  it('builds path, toward and from subgraphs', () => {
    expect(buildPathSubgraph(graph, 'a', 'd').nodeIds.sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(buildPathSubgraph(graph, 'd', 'e').nodeIds).toEqual([])
    expect(buildTowardSubgraph(graph, 'd').edges).toHaveLength(2)
    expect(buildFromSubgraph(graph, 'a').nodeIds.sort()).toEqual(['a', 'b', 'c'])
  })

  it('positions each node of a subgraph', () => {
    const positioned = layoutSubgraph(buildFromSubgraph(graph, 'a'))
    expect(positioned.map((node) => node.id).sort()).toEqual(['a', 'b', 'c'])
  })
})
