import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { hasIndexedTile, parseTileIndex } from '../../src/utils/mapTileIndex'

function encode(z: number, tiles: Array<[number, number]>): string {
  const size = 2 ** z
  const bits = new Uint8Array(Math.ceil(size ** 2 / 8))
  for (const [x, y] of tiles) {
    const bit = y * size + x
    bits[bit >> 3] |= 0x80 >> (bit & 7)
  }
  return btoa(String.fromCharCode(...bits))
}

describe('parseTileIndex', () => {
  it('decodes per-zoom bitmaps and answers lookups', () => {
    const index = parseTileIndex({ zooms: { 3: encode(3, [[1, 2], [7, 7]]) } })

    expect(index).not.toBeNull()
    expect(hasIndexedTile(index!, { z: 3, x: 1, y: 2 })).toBe(true)
    expect(hasIndexedTile(index!, { z: 3, x: 7, y: 7 })).toBe(true)
    expect(hasIndexedTile(index!, { z: 3, x: 2, y: 1 })).toBe(false)
    expect(hasIndexedTile(index!, { z: 3, x: 8, y: 0 })).toBe(false)
  })

  it('assumes zooms missing from the index are complete', () => {
    const index = parseTileIndex({ zooms: { 3: encode(3, []) } })!

    expect(hasIndexedTile(index, { z: 4, x: 5, y: 5 })).toBe(true)
  })

  it.each([null, 'x', {}, { zooms: null }, { zooms: { 3: 'AAAA' } }, { zooms: { 3: 42 } }, { zooms: { 3: '!!!' } }, { zooms: {} }])('rejects malformed payload %j', (payload) => {
    expect(parseTileIndex(payload)).toBeNull()
  })

  it('parses the generated public/data/map-tiles-index.json with a complete z2-6 and a sparse z7', () => {
    const index = parseTileIndex(JSON.parse(readFileSync('public/data/map-tiles-index.json', 'utf8')))!
    const count = (z: number): number => {
      let n = 0
      for (let x = 0; x < 2 ** z; x += 1) for (let y = 0; y < 2 ** z; y += 1) if (hasIndexedTile(index, { z, x, y })) n += 1
      return n
    }

    for (const z of [2, 3, 4, 5, 6]) expect(count(z)).toBe(4 ** z)
    expect(count(7)).toBeLessThan(4 ** 7)
    expect(hasIndexedTile(index, { z: 7, x: 51, y: 28 })).toBe(false)
    expect(hasIndexedTile(index, { z: 6, x: 27, y: 16 })).toBe(true)
  })
})
