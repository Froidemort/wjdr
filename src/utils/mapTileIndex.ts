import type { TileCoords } from './mapTileCache'

/** Per-zoom bitmaps of the tiles that exist in the bucket (the pyramid is sparse at the highest zoom). */
export type MapTileIndex = ReadonlyMap<number, Uint8Array>

function decodeBase64(value: string): Uint8Array | null {
  try {
    return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
  } catch {
    return null
  }
}

/** Parses the generated `map-tiles-index.json`; null when the payload is malformed. */
export function parseTileIndex(data: unknown): MapTileIndex | null {
  if (typeof data !== 'object' || data === null) return null

  const zooms = (data as { zooms?: unknown }).zooms
  if (typeof zooms !== 'object' || zooms === null) return null

  const index = new Map<number, Uint8Array>()
  for (const [zoom, encoded] of Object.entries(zooms)) {
    const z = Number(zoom)
    const bits = typeof encoded === 'string' ? decodeBase64(encoded) : null
    if (!Number.isInteger(z) || !bits || bits.length !== Math.ceil(4 ** z / 8)) return null
    index.set(z, bits)
  }

  return index.size > 0 ? index : null
}

/** Bit `y * 2^z + x`, MSB first. Zooms absent from the index are assumed complete. */
export function hasIndexedTile(index: MapTileIndex, { z, x, y }: TileCoords): boolean {
  const bits = index.get(z)
  if (!bits) return true

  const size = 2 ** z
  if (x < 0 || y < 0 || x >= size || y >= size) return false

  const bit = y * size + x
  return (bits[bit >> 3] & (0x80 >> (bit & 7))) !== 0
}
